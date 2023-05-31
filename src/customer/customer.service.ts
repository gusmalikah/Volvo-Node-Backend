import { Body, HttpException, Injectable, Res, } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma.service';
import { GetCustomerInput } from './dto/customer.input';
import { Customer } from '@prisma/client';
import * as bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"
import { sendMail } from 'src/util/sendMail';
import otpGenerator from 'otp-generator';
import { HttpStatus } from '@nestjs/common';


const saltRounds = 10
@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) { }


  async findAll(params: GetCustomerInput) {
    const { skip, take, cursor, where } = params;
    return this.prisma.customer.findMany({
      skip,
      take,
      cursor,
      where,
    });
  }


  async signup(@Body() customerData: Pick<Customer, 'email' | 'password'>): Promise<any> {
    const { email, password } = customerData;

    if (!email || !password) {
      throw new HttpException('Email and password are required.', HttpStatus.BAD_REQUEST);
    }
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      throw new HttpException('An account with this email already exists.', HttpStatus.CONFLICT);
    }
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newCustomer = await this.prisma.customer.create({
        data: { email, password: hashedPassword },
      });

      const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
      await this.prisma.verificationCode.create({ data: { code: otp, email: newCustomer.email } });
      sendMail({ to: newCustomer.email, subject: 'Verification', text: 'Here is your verification code: ' + otp });

      return {
        id: newCustomer.id,
        email: newCustomer.email,
        createdAt: newCustomer.createdAt,
        updatedAt: newCustomer.updatedAt,
        verified: newCustomer.verfied,
      };
    } catch (error) {
      throw new HttpException('An error occurred during signup.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async login(
    @Body() customerData: Pick<Customer, 'email' | 'password'>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string } | { error: string }> {
    const { email, password } = customerData;

    if (!email || !password) {
      throw new HttpException('Email and password are required.', HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.customer.findFirst({ where: { email } });
    if (!user) {
      throw new HttpException('Invalid Email or Password.', HttpStatus.UNAUTHORIZED);
    }

    if (!user.verfied) {
      throw new HttpException('Please verify your email first.', HttpStatus.UNAUTHORIZED);
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new HttpException('Invalid Email or Password.', HttpStatus.UNAUTHORIZED);
    }

    try {
      const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7 days' });

      res.cookie('refreshToken', refreshToken, { httpOnly: true });

      return { accessToken };
    } catch (error) {
      throw new HttpException('An error occurred during login.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async verify(@Body() body: { email: string, code: string }, @Res({ passthrough: true }) res: Response) {
    const { email, code } = body;
    const ver = await this.prisma.verificationCode.findUnique({ where: { email: email } });

    if (!ver) {
      throw new HttpException('You are already verified.', HttpStatus.BAD_REQUEST);
    }

    if (ver.code === code) {
      const updated = await this.prisma.customer.update({
        where: {
          email: email
        },
        data: {
          verfied: true
        }
      });

      await this.prisma.verificationCode.delete({ where: { email: email } });

      return {
        id: updated.id,
        email: updated.email,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        verified: updated.verfied,
      };
    } else {
      throw new HttpException('Invalid verification code.', HttpStatus.BAD_REQUEST);
    }
  }


  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err: any, data: any) => {
      if (err) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const accessToken = jwt.sign({ id: data.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      response.json({ accessToken });
    });
  }
}

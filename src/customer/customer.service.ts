import { Body, Injectable, Post } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { GetCustomerInput } from './dto/customer.input';
import { Customer } from '@prisma/client';
import * as bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

const saltRounds = 10
@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}


  async findAll(params: GetCustomerInput) {
    const { skip, take, cursor, where } = params;
    return this.prisma.customer.findMany({
      skip,
      take,
      cursor,
      where,
    });
  }

  async signup(@Body() customerData: Pick<Customer, "email" | "password">):Promise<Omit<Customer, "password"> |{ error:string}> {
    const { email, password } = customerData;
  
    if (!email || !password) {
      return {
        error: 'Email and password are required.'
      };
    }
  
    try {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { email }
      });
  
      if (existingCustomer) {
        return {
          error: 'An account with this email already exists.'
        };
      }
  
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newCustomer = await this.prisma.customer.create({
        data: { email, password: hashedPassword }
      });
  
      return {
        id: newCustomer.id,
        email: newCustomer.email,
        createdAt: newCustomer.createdAt,
        updatedAt: newCustomer.updatedAt
      };
    } catch (error) {
      return {
        error: 'An error occurred during signup.'
      };
    }
  }
  

  @Post("login")
  async login(
    @Body() customerData: Pick<Customer, "email" | "password">
  ): Promise<{ accessToken: string } | { error: string }> {
    try {
      const { email, password } = customerData;

      if(!email || !password){
        return {
          error: "Email and password are required."
        };
      }
      const user = await this.prisma.customer.findFirst({ where: { email } });

      if (user) {
        const match = await bcrypt.compare(password, user.password);

        if (match) {
          const accessToken = jwt.sign(
            { id: user.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
          );
          return { accessToken };
        }
      }

      throw new Error("Invalid Email or Password.");
    } catch (error) {
      return { error: 'An error occurred during login.' };
    }
  }
  
}

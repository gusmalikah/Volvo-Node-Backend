import { Body, Injectable } from '@nestjs/common';
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

  async register(@Body() customerData: Pick<Customer, "email"|"password">){
    const { email, password } = customerData;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newCustomer = await this.prisma.customer.create({data: {email, password: hashedPassword}})
    return {
      id: newCustomer.id,
      email: newCustomer.email,
      createdAt: newCustomer.createdAt,
      updatedAt: newCustomer.updatedAt
    }
  }

  async login(@Body() customerData: Pick<Customer, "email"|"password">){
    const { email, password } = customerData;
    const user = await this.prisma.customer.findFirst({where: {email}})
    const match = await bcrypt.compare(password, user.password)

    if (user && match) {
      const accessToken = jwt.sign(
        { id: user.id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      )
      return {accessToken};
    } else {
      throw new Error("Invalid Email or Password.")
    }
  }
  
}

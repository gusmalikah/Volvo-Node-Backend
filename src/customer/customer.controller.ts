import { Body, Controller, Get, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from '@prisma/client';
import { GetCustomerInput } from './dto/customer.input';

@Controller("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async getAll(params: GetCustomerInput){
    return this.customerService.findAll(params)
  }

  @Post("signup")
  async signup(@Body() customerData: Pick<Customer, "email"|"password">): Promise<Omit<Customer, "password"> | {error:string}> {
    return this.customerService.signup(customerData);
  }

  @Post("login")
  async login(@Body() customerData: Pick<Customer, "email"|"password">): Promise<{accessToken:string} | {error: string}> {
    return this.customerService.login(customerData);
  }
}

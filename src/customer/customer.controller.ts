import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from '@prisma/client';
import { GetCustomerInput } from './dto/customer.input';
import { Request, Response } from 'express';


@Controller("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}


  @Get()
  async getAll(@Query() params: GetCustomerInput){
    return this.customerService.findAll(params)
  }

  @Post("signup")
  async signup(@Body() customerData: Pick<Customer, "email"|"password">): Promise<Omit<Customer, "password"> | {error:string}> {
    return this.customerService.signup(customerData);
  }

  @Post("login")
  async login(@Body() customerData: Pick<Customer, "email"|"password">, @Res({passthrough: true}) res:Response): Promise<{accessToken:string} | {error: string}> {
    return this.customerService.login(customerData, res);
  }

  @Post("refresh")
  async refresh(@Req() request: Request, @Res() response: Response) {
    return this.customerService.refresh(request, response)
    }

  @Post("verify")
  async verify(@Body() body:{email: string, code: string}, @Res({passthrough: true}) res:Response){
    return this.customerService.verify(body, res)
  }

}

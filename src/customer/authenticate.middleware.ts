import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken"
import { PrismaService } from "src/prisma.service";

export class AuthenticationMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) {}
    use(req: Request, res: Response, next: NextFunction) {
        console.log("Authenticating...")
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if (!token) return res.sendStatus(401)
        //verify access token
        jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            async (err, accessTokenData) => {
                next()
            }
        )
    }
}
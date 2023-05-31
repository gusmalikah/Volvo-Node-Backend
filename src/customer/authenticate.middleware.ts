import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken"
import { PrismaService } from "src/prisma.service";

export class AuthenticationMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) {}
    use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if (!token) return res.sendStatus(401)
        jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            async (err) => {
                if(err){
                    res.sendStatus(401)
                } else {
                    next();
                }
            }
        )
    }
}
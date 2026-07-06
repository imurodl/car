import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
	private readonly logger = new Logger(WithoutGuard.name);

	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		this.logger.debug('--- @guard() Authentication [WithoutGuard] ---');

		if (context.getType<GqlContextType>() === 'graphql') {
			const request = context.getArgByIndex(2).req,
				bearerToken = request.headers.authorization;

			if (bearerToken) {
				try {
					const token = bearerToken.split(' ')[1],
						authMember = await this.authService.verifyToken(token);
					request.body.authMember = authMember;
				} catch (err) {
					request.body.authMember = null;
				}
			} else request.body.authMember = null;

			this.logger.debug(`memberNick[without] => ${request.body.authMember?.memberNick ?? 'none'}`);
			return true;
		} else return false;

		// description => http, rpc, gprs and etc are ignored
	}
}

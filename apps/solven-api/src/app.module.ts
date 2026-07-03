import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { SocketModule } from './socket/socket.module';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';

// Fail fast at boot when critical secrets are missing (a blank SECRET_TOKEN
// silently signs JWTs with the string "undefined").
const graphqlLogger = new Logger('GraphQL');

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
				SECRET_TOKEN: Joi.string().required(),
				// Optional by design: REFRESH_SECRET falls back to SECRET_TOKEN+'_refresh',
				// and MONGO_DEV is unset in prod (which selects MONGO_PROD via NODE_ENV).
				REFRESH_SECRET: Joi.string().optional(),
				MONGO_PROD: Joi.string().required(),
				MONGO_DEV: Joi.string().optional(),
				PORT_API: Joi.number().default(3007),
				PORT_BATCH: Joi.number().default(3008),
			}),
		}),
		// Rate limiting is opt-in per-resolver (no global APP_GUARD) — only auth mutations use it.
		ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			introspection: process.env.NODE_ENV !== 'production',
			uploads: false,
			autoSchemaFile: true,
			formatError: (error: T) => {
				const code = error?.extensions?.code;
				const message =
					error?.extensions?.exception?.response?.message || error?.extensions?.response?.message || error?.message;
				graphqlLogger.error(`${code ?? 'ERROR'}: ${JSON.stringify(message)}`);
				// Don't leak internal error text/stack to clients in production; unexpected
				// (non-HttpException) errors surface as INTERNAL_SERVER_ERROR — mask those.
				const leak = process.env.NODE_ENV !== 'production' || code !== 'INTERNAL_SERVER_ERROR';
				return {
					code,
					message: leak ? message : 'Internal server error',
				};
			},
		}),
		ComponentsModule, // http connection
		DatabaseModule, SocketModule, // tcp connection
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}

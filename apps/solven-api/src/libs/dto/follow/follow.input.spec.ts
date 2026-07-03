import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FollowInquiry } from './follow.input';

describe('FollowInquiry pagination caps', () => {
	it('rejects a limit greater than 100', () => {
		const dto = plainToInstance(FollowInquiry, { page: 1, limit: 101, search: {} });
		const errors = validateSync(dto);
		const limitError = errors.find((e) => e.property === 'limit');

		expect(limitError).toBeDefined();
		expect(limitError?.constraints).toHaveProperty('max');
	});

	it('accepts a limit at the cap', () => {
		const dto = plainToInstance(FollowInquiry, { page: 1, limit: 100, search: {} });
		const errors = validateSync(dto);
		const limitError = errors.find((e) => e.property === 'limit');

		expect(limitError).toBeUndefined();
	});
});

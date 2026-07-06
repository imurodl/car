import { CarResolver } from './car.resolver';
import { CarService } from './car.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';

const OID = '000000000000000000000001';

describe('CarResolver', () => {
	let resolver: CarResolver;
	let carService: {
		createCar: jest.Mock;
		getCar: jest.Mock;
		updateCar: jest.Mock;
		getCars: jest.Mock;
		likeTargetCar: jest.Mock;
		getFavorites: jest.Mock;
	};

	beforeEach(() => {
		carService = {
			createCar: jest.fn().mockResolvedValue({ _id: 'car-1' }),
			getCar: jest.fn().mockResolvedValue({ _id: 'car-1' }),
			updateCar: jest.fn().mockResolvedValue({ _id: 'car-1' }),
			getCars: jest.fn().mockResolvedValue({ list: [], metaCounter: [] }),
			likeTargetCar: jest.fn().mockResolvedValue({ _id: 'car-1' }),
			getFavorites: jest.fn().mockResolvedValue({ list: [], metaCounter: [] }),
		};
		resolver = new CarResolver(carService as unknown as CarService);
	});

	it('createCar stamps the authMember id and delegates to the service', async () => {
		const input: any = { carTitle: 'nice' };
		await resolver.createCar(input, 'member-1' as any);

		expect(input.memberId).toBe('member-1');
		expect(carService.createCar).toHaveBeenCalledWith(input);
	});

	it('getCar shapes the id and passes the viewer id through', async () => {
		await resolver.getCar(OID, 'member-1' as any);

		expect(carService.getCar).toHaveBeenCalledTimes(1);
		const [memberId, carId] = carService.getCar.mock.calls[0];
		expect(memberId).toBe('member-1');
		expect(String(carId)).toBe(OID);
	});

	it('getCars forwards the inquiry and the viewer id', async () => {
		const input: any = { page: 1, limit: 10, search: {} };
		await resolver.getCars(input, 'member-1' as any);

		expect(carService.getCars).toHaveBeenCalledWith('member-1', input);
	});

	it('updateCar shapes the target id and delegates with the owner id', async () => {
		const input: any = { _id: OID, carTitle: 'renamed' };
		await resolver.updateCar(input, 'member-1' as any);

		expect(carService.updateCar).toHaveBeenCalledTimes(1);
		const [memberId, passed] = carService.updateCar.mock.calls[0];
		expect(memberId).toBe('member-1');
		expect(String(passed._id)).toBe(OID);
	});

	it('likeTargetCar shapes the ref id and delegates with the liker id', async () => {
		await resolver.likeTargetCar(OID, 'member-1' as any);

		expect(carService.likeTargetCar).toHaveBeenCalledTimes(1);
		const [memberId, refId] = carService.likeTargetCar.mock.calls[0];
		expect(memberId).toBe('member-1');
		expect(String(refId)).toBe(OID);
	});

	describe('guards', () => {
		const guardsOf = (method: (...args: any[]) => any) => Reflect.getMetadata('__guards__', method) ?? [];

		it('protects getCar with WithoutGuard (optional auth)', () => {
			expect(guardsOf(resolver.getCar)).toContain(WithoutGuard);
		});

		it('protects getCars with WithoutGuard (optional auth)', () => {
			expect(guardsOf(resolver.getCars)).toContain(WithoutGuard);
		});

		it('protects createCar with RolesGuard', () => {
			expect(guardsOf(resolver.createCar)).toContain(RolesGuard);
		});

		it('protects getFavorites with AuthGuard', () => {
			expect(guardsOf(resolver.getFavorites)).toContain(AuthGuard);
		});

		it('protects likeTargetCar with AuthGuard', () => {
			expect(guardsOf(resolver.likeTargetCar)).toContain(AuthGuard);
		});
	});
});

import { BoardArticleResolver } from './board-article.resolver';
import { BoardArticleService } from './board-article.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';

const OID = '000000000000000000000001';

describe('BoardArticleResolver', () => {
	let resolver: BoardArticleResolver;
	let boardArticleService: {
		createBoardArticle: jest.Mock;
		getBoardArticle: jest.Mock;
		updateBoardArticle: jest.Mock;
		likeTargetBoardArticle: jest.Mock;
		getAllBoardArticlesByAdmin: jest.Mock;
	};

	beforeEach(() => {
		boardArticleService = {
			createBoardArticle: jest.fn().mockResolvedValue({ _id: 'a-1' }),
			getBoardArticle: jest.fn().mockResolvedValue({ _id: 'a-1' }),
			updateBoardArticle: jest.fn().mockResolvedValue({ _id: 'a-1' }),
			likeTargetBoardArticle: jest.fn().mockResolvedValue({ _id: 'a-1' }),
			getAllBoardArticlesByAdmin: jest.fn().mockResolvedValue({ list: [], metaCounter: [] }),
		};
		resolver = new BoardArticleResolver(boardArticleService as unknown as BoardArticleService);
	});

	it('createBoardArticle delegates with the author id and input', async () => {
		const input: any = { articleTitle: 'hi' };
		await resolver.createBoardArticle(input, 'member-1' as any);

		expect(boardArticleService.createBoardArticle).toHaveBeenCalledWith('member-1', input);
	});

	it('getBoardArticle shapes the id and passes the viewer id', async () => {
		await resolver.getBoardArticle(OID, 'member-1' as any);

		const [memberId, articleId] = boardArticleService.getBoardArticle.mock.calls[0];
		expect(memberId).toBe('member-1');
		expect(String(articleId)).toBe(OID);
	});

	it('updateBoardArticle shapes the target id and delegates with the owner id', async () => {
		const input: any = { _id: OID, articleTitle: 'renamed' };
		await resolver.updateBoardArticle(input, 'member-1' as any);

		const [memberId, passed] = boardArticleService.updateBoardArticle.mock.calls[0];
		expect(memberId).toBe('member-1');
		expect(String(passed._id)).toBe(OID);
	});

	it('likeTargetBoardArticle shapes the ref id and delegates with the liker id', async () => {
		await resolver.likeTargetBoardArticle(OID, 'member-1' as any);

		const [memberId, refId] = boardArticleService.likeTargetBoardArticle.mock.calls[0];
		expect(memberId).toBe('member-1');
		expect(String(refId)).toBe(OID);
	});

	it('getAllBoardArticlesByAdmin forwards the inquiry', async () => {
		const input: any = { page: 1, limit: 10, search: {} };
		await resolver.getAllBoardArticlesByAdmin(input);

		expect(boardArticleService.getAllBoardArticlesByAdmin).toHaveBeenCalledWith(input);
	});

	describe('guards', () => {
		const guardsOf = (method: (...args: any[]) => any) => Reflect.getMetadata('__guards__', method) ?? [];

		it('protects createBoardArticle with AuthGuard', () => {
			expect(guardsOf(resolver.createBoardArticle)).toContain(AuthGuard);
		});

		it('protects getBoardArticle with WithoutGuard (optional auth)', () => {
			expect(guardsOf(resolver.getBoardArticle)).toContain(WithoutGuard);
		});

		it('protects updateBoardArticle with AuthGuard', () => {
			expect(guardsOf(resolver.updateBoardArticle)).toContain(AuthGuard);
		});

		it('protects getAllBoardArticlesByAdmin with RolesGuard', () => {
			expect(guardsOf(resolver.getAllBoardArticlesByAdmin)).toContain(RolesGuard);
		});
	});
});

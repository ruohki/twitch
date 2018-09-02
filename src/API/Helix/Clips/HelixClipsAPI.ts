import BaseAPI from '../../BaseAPI';
import { TwitchApiCallType } from '../../../TwitchClient';
import HelixResponse from '../HelixResponse';
import HelixPagination from '../HelixPagination';
import HelixPaginatedResult from '../HelixPaginatedResult';
import HelixClip, { HelixClipData } from './HelixClip';

export type HelixClipFilterType = 'broadcaster_id' | 'game_id' | 'id';

/**
 * A Helix clip filter definition.
 */
export interface HelixClipFilter extends HelixPagination {
	/**
	 * The type of filter. You can filter by broadcaster, game or just get some clips by their IDs.
	 */
	filterType: HelixClipFilterType;

	/**
	 * The IDs you want to filter for.
	 *
	 * Please note that the broadcaster and game filters only support a single ID, but you still need to pass it as an array.
	 */
	ids: string[];
}

/**
 * Parameters for creating a clip.
 */
export interface HelixClipCreateParams {
	/**
	 * The ID of the channel of which you want to create a clip.
	 */
	channelId: string;

	/**
	 * Add a delay before the clip creation that accounts for the usual delay in the viewing experience.
	 */
	createAfterDelay?: boolean;
}

/** @private */
export interface HelixClipCreateResponse {
	id: string;
	edit_url: string;
}

/**
 * The Helix API methods that deal with clips.
 *
 * Can be accessed using `client.helix.clips` on a {@TwitchClient} instance.
 *
 * ## Example
 * ```ts
 * const client = new TwitchClient(options);
 * const leaderboard = await client.helix.clips.createClip({ channelId: '125328655' });
 * ```
 */
export default class HelixClipsAPI extends BaseAPI {
	/**
	 * Retrieves the latest clips for the specified broadcaster.
	 *
	 * @param id The broadcaster's user ID.
	 * @param pagination Parameters for pagination.
	 */
	async getClipsForBroadcaster(id: string, pagination: HelixPagination) {
		return this.getClips({
			...pagination,
			filterType: 'broadcaster_id',
			ids: [id]
		});
	}

	/**
	 * Retrieves the latest clips for the specified game.
	 *
	 * @param id The game ID.
	 * @param pagination Parameters for pagination.
	 */
	async getClipsForGame(id: string, pagination: HelixPagination) {
		return this.getClips({
			...pagination,
			filterType: 'game_id',
			ids: [id]
		});
	}

	/**
	 * Retrieves the latest clips for the specified broadcaster.
	 *
	 * @param ids The clip IDs.
	 */
	async getClipsByIds(ids: string[]) {
		return this.getClips({
			filterType: 'id',
			ids
		});
	}

	/**
	 * Retrieves the latest clips based on specified filter parameters.
	 *
	 * Please note that you rarely need to use this method. You should use {@HelixClipsAPI#getClipsForBroadcaster},
	 * {@HelixClipsAPI#getClipsForGame} or {@HelixClipsAPI#getClipsByIds} instead.
	 *
	 * @expandParams
	 */
	async getClips(params: HelixClipFilter): Promise<HelixPaginatedResult<HelixClip[]>> {
		const { filterType, ids, after, before, limit } = params;
		const result = await this._client.apiCall<HelixResponse<HelixClipData[]>>({
			type: TwitchApiCallType.Helix,
			url: 'clips',
			method: 'GET',
			query: {
				[filterType]: ids,
				after,
				before,
				first: limit
			}
		});

		return {
			data: result.data.map(data => new HelixClip(data, this._client)),
			cursor: result.pagination.cursor
		};
	}

	/**
	 * Creates a clip of a running stream.
	 *
	 * Returns the ID of the clip.
	 *
	 * @expandParams
	 */
	async createClip(params: HelixClipCreateParams) {
		const { channelId, createAfterDelay = false } = params;
		const result = await this._client.apiCall<{ data: [HelixClipCreateResponse] }>({
			type: TwitchApiCallType.Helix,
			url: 'clips',
			method: 'POST',
			scope: 'clips:edit',
			query: {
				broadcaster_id: channelId,
				has_delay: createAfterDelay.toString()
			}
		});

		return result.data[0].id;
	}
}

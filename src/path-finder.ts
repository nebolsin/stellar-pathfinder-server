
import { buy } from './orderbook';

// -----------------------------------------------------------------------------

import {
    Graph
} from './graph';

const enum Constants {
    maxLengthMinusOne = 7 - 1
}

// -----------------------------------------------------------------------------

/**
 *
 * @param graph
 * @param targetAssets
 * @param destAsset
 * @param destAmount
 */

export function findPaths(
    graph: Graph,
    targetAssets: string[],
    destAsset: string,
    destAmount: number
) {

    //
    //  take a short-cut if we're trying to find a path from ['native'] to 'native':
    //

    if ((destAsset === 'native') && (targetAssets.length === 1)) {
        return {
            'native': [
                [destAmount, []]
            ]
        };
    }

    //
    //  the lowest cost so far for a path going from an asset to `destAsset`
    //

    const lowestCost = new Map<string, number>();

    //
    //  the paths found for each individual target asset
    //

    const paths = {};
    for (const asset of targetAssets) {
        paths[asset] = [];
    }

    //
    //  take a short-cut if `destAssset` is one of the target assets,
    //  and add a direct path already from the start
    //

    if (targetAssets.includes(destAsset)) {
        paths[destAsset].push([destAmount, []]);
        lowestCost.set(destAsset, destAmount);
    }

    //
    //  the current path being checked
    //

    const path: string[] = [];

    const find = (destAsset: string, amountIn: number) => {

        if (path.includes(destAsset)) {
            return;
        }

        //
        //  if we get to an a point where we've come to in a previous path
        //  and that path has a lower cost than this one, then there's no point
        //  in traversing any further
        //

        const cost = lowestCost.get(destAsset);
        if (!cost || (amountIn < cost)) {
            lowestCost.set(destAsset, amountIn);
        } else {
            return;
        }

        //
        //  if the current asset is one of our target assets,
        //  store away the path we've taken to get here
        //

        if (destAsset in paths) {
            paths[destAsset].push([amountIn, path.slice(1).reverse()]);
        }

        //
        //  if we're at the maximum path length (`path` + `destAsset`),
        //  stop searching
        //

        if (path.length === Constants.maxLengthMinusOne) {
            return;
        }

        //
        //  fan out
        //

        const arcs = graph.get(destAsset);
        if (arcs) {
            path.push(destAsset);
            for (const [sourceAsset, capacity, orderBook] of arcs) {
                if (capacity >= amountIn) {
                    const amountOut = buy(orderBook, amountIn);
                    find(sourceAsset, amountOut);
                }
            }
            path.pop();
        }
    };

    find(destAsset, destAmount);

    return paths;
}

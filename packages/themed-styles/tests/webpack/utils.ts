import { Callback, each as baseEach, MatchedFile, TargetFilter } from '../utils';

export function each(targetFilter: TargetFilter, toMatchFile: MatchedFile, callback: Callback) {
    return baseEach(__dirname, targetFilter, toMatchFile, callback);
}

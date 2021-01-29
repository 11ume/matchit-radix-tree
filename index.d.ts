
type Params = {
    [key: string]: string
};

type Handler = (...args: any[]) => any;

type Found = {
    handler: Handler
    , params: Params
};

type Lookup = (method: string, path: string) => Found | null;
type Create = (method: string, path: string, handler: Handler) => Found | null;

type Matcher = {
    lookup: Lookup
    , create: Create
};

declare function matcher(maxParamLength?: number): Matcher;
export = matcher;
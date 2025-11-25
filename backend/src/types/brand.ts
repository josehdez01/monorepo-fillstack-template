export type Brand<T, B> = T & { readonly __brand: B };
export type WithBrandedId<T, B> = Omit<T, 'id'> & {
    id: Brand<T extends { id: infer I } ? I : never, B>;
};

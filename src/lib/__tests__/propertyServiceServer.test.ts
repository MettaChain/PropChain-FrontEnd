jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { getPopularPropertyIds } from '../propertyServiceServer';
import { MOCK_PROPERTIES, getFeaturedProperties } from '../mockData';

describe('getPopularPropertyIds (#1102)', () => {
  it('returns real, pre-renderable ids for generateStaticParams', async () => {
    const ids = await getPopularPropertyIds();
    const featured = getFeaturedProperties();

    expect(featured.length).toBeGreaterThan(0);
    expect(ids).toEqual(featured.map((property) => property.id));
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => MOCK_PROPERTIES.some((property) => property.id === id))).toBe(
      true
    );
  });

  it('respects the limit', async () => {
    const ids = await getPopularPropertyIds(2);
    expect(ids).toHaveLength(2);
  });
});

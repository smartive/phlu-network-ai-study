'use server';

import { findOneByUserId, insert, update } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { DBNetworkMap } from '@/types/db';
import type { Person } from '@/types/network-map';
import { revalidateTag } from 'next/cache';

export async function saveNetworkMap(people: Person[]) {
  const session = await getSession();

  if (!session.user.userId) {
    throw new Error('User ID not found');
  }

  const existingMap = await findOneByUserId<DBNetworkMap>(
    'network_maps',
    session.user.userId
  );

  const mapData = {
    user_id: session.user.userId,
    map_data: { people },
  };

  if (existingMap) {
    await update('network_maps', existingMap.id, mapData);
    revalidateTag(`network-map-${session.user.userId}`);
    return existingMap.id;
  }

  const newMap = await insert<DBNetworkMap>('network_maps', mapData);

  revalidateTag(`network-map-${session.user.userId}`);

  return newMap.id;
}

import { findOneByUserId } from '@/lib/db';
import { getSession } from '@/lib/session';
import { DBNetworkMap } from '@/types/db';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { NetworkVisualizationPDF } from '@/components/network-visualization-pdf';
import { Person } from '@/types/network-map';

export async function POST() {
  const session = await getSession();
  const userId = session.user.userId;

  const networkMap = await findOneByUserId<DBNetworkMap>(
    'network_maps',
    userId
  );

  if (!networkMap) {
    return NextResponse.json(
      { error: 'Network map not found' },
      { status: 404 }
    );
  }

  const people = (networkMap.map_data as { people: Person[] }).people;

  // Generate PDF
  const pdfStream = await renderToStream(
    <NetworkVisualizationPDF people={people} />
  );

  // Convert stream to buffer
  const chunks: Buffer[] = [];
  for await (const chunk of pdfStream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  // Return PDF as downloadable file
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="network-map.pdf"',
    },
  });
}

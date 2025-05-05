import { Person } from '@/types/network-map';
import {
  Circle,
  Document,
  G,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  visualization: {
    width: '100%',
    height: 'auto',
    aspectRatio: 1,
    position: 'relative',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 10,
  },
  tableCellHeader: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
  },
});

interface NetworkVisualizationPDFProps {
  people: Person[];
}

export function NetworkVisualizationPDF({
  people,
}: NetworkVisualizationPDFProps) {
  const radius = 300;
  const centerX = 350;
  const centerY = 350;
  const layers = {
    4: radius * 0.25,
    3: radius * 0.45,
    2: radius * 0.7,
    1: radius * 0.95,
  } as const;

  const labels = {
    4: 'sehr bedeutsam',
    3: 'bedeutsam',
    2: 'wenig bedeutsam',
    1: '',
  } as const;

  // Group people by significance and calculate positions
  const circles = Object.entries(
    people.reduce((acc, person) => {
      if (!acc[person.significance]) {
        acc[person.significance] = [];
      }
      acc[person.significance].push(person);
      return acc;
    }, {} as Record<1 | 2 | 3 | 4, Person[]>)
  ).flatMap(([significance, peopleInLayer]) => {
    const layerRadius = layers[Number(significance) as keyof typeof layers];
    const spacing = (2 * Math.PI) / Math.max(peopleInLayer.length, 1);

    return peopleInLayer.map((person, i) => {
      const baseAngle = spacing * i;
      const jitter = (Math.random() - 0.5) * spacing * 0.5;
      const angle = baseAngle + jitter;

      return {
        ...person,
        x: centerX + Math.cos(angle) * layerRadius,
        y: centerY + Math.sin(angle) * layerRadius,
      };
    });
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Ihre Netzwerkkarte</Text>

        <View style={styles.visualization}>
          <Svg viewBox="0 0 700 700" preserveAspectRatio="xMidYMid meet">
            {/* Background circles */}
            <Circle
              cx={350}
              cy={350}
              r={285}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <Circle
              cx={350}
              cy={350}
              r={210}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <Circle
              cx={350}
              cy={350}
              r={135}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <Circle
              cx={350}
              cy={350}
              r={75}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={1}
            />

            {/* Layer labels */}
            <Text
              x={350}
              y={40}
              style={{
                textAnchor: 'middle',
                fill: '#6b7280',
                fontSize: 12,
              }}
            >
              {labels[1]}
            </Text>
            <Text
              x={350}
              y={115}
              style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
            >
              {labels[2]}
            </Text>
            <Text
              x={350}
              y={190}
              style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
            >
              {labels[3]}
            </Text>
            <Text
              x={350}
              y={265}
              style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }}
            >
              {labels[4]}
            </Text>

            {/* Center point - You */}
            <G>
              <Circle
                cx={350}
                cy={350}
                r={30}
                fill="white"
                stroke="#2563eb"
                strokeWidth={2}
              />
              <Text
                x={350}
                y={355}
                style={{
                  textAnchor: 'middle',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              >
                Ich
              </Text>
            </G>

            {/* People nodes */}
            {circles.map((person) => (
              <G key={person.id}>
                <Circle
                  cx={person.x}
                  cy={person.y}
                  r={35}
                  fill="white"
                  stroke="#93c5fd"
                  strokeWidth={2}
                />
                <Text
                  x={person.x}
                  y={person.y}
                  style={{
                    textAnchor: 'middle',
                    fontSize: 10,
                  }}
                >
                  {person.name.length > 10
                    ? `${person.name.slice(0, 8)}...`
                    : person.name}
                </Text>
              </G>
            ))}
          </Svg>
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellHeader}>Name</Text>
            <Text style={styles.tableCellHeader}>Funktion</Text>
            <Text style={styles.tableCellHeader}>Setting</Text>
            <Text style={styles.tableCellHeader}>Gelerntes</Text>
            <Text style={styles.tableCellHeader}>Bedeutsamkeit</Text>
          </View>
          {people.map((person) => (
            <View key={person.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{person.name}</Text>
              <Text style={styles.tableCell}>{person.function}</Text>
              <Text style={styles.tableCell}>{person.setting}</Text>
              <Text style={styles.tableCell}>{person.learningOutcome}</Text>
              <Text style={styles.tableCell}>
                {labels[person.significance as keyof typeof labels]}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

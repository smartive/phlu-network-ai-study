'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Person } from '@/types/network-map';
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { Pencil } from 'lucide-react';

interface NetworkVisualizationProps {
  people: Person[];
  onEditPerson?: (person: Person) => void;
  onDeletePerson?: (personId: string) => void;
}

export function NetworkVisualization({
  people,
  onEditPerson,
  onDeletePerson,
}: NetworkVisualizationProps) {
  const circles = useMemo(() => {
    const radius = 300;
    const centerX = 350;
    const centerY = 350;
    const layers = {
      4: radius * 0.25,
      3: radius * 0.45,
      2: radius * 0.7,
      1: radius * 0.95,
    } as const;

    // Group people by significance
    const grouped = people.reduce((acc, person) => {
      if (!acc[person.significance]) {
        acc[person.significance] = [];
      }
      acc[person.significance].push(person);
      return acc;
    }, {} as Record<1 | 2 | 3 | 4, Person[]>);

    // Calculate positions with collision avoidance
    return Object.entries(grouped).flatMap(([significance, peopleInLayer]) => {
      const layerRadius = layers[Number(significance) as keyof typeof layers];
      const spacing = (2 * Math.PI) / Math.max(peopleInLayer.length, 1);

      return peopleInLayer.map((person, i) => {
        // Add slight randomization to angle to avoid perfect alignment
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
  }, [people]);

  const labels = {
    4: 'sehr bedeutsam',
    3: 'bedeutsam',
    2: 'wenig bedeutsam',
    1: '',
  } as const;

  return (
    <div className="space-y-6">
      <div className="grid place-items-center w-full mx-auto bg-white rounded-lg p-4 overflow-auto">
        <svg width="700" height="700">
          {/* Background circles */}
          <circle
            cx="350"
            cy="350"
            r="285"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <circle
            cx="350"
            cy="350"
            r="210"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <circle
            cx="350"
            cy="350"
            r="135"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <circle
            cx="350"
            cy="350"
            r="75"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Layer labels */}
          <text
            x="350"
            y="40"
            textAnchor="middle"
            className="text-sm fill-gray-500"
          >
            {labels[1]}
          </text>
          <text
            x="350"
            y="115"
            textAnchor="middle"
            className="text-sm fill-gray-500"
          >
            {labels[2]}
          </text>
          <text
            x="350"
            y="190"
            textAnchor="middle"
            className="text-sm fill-gray-500"
          >
            {labels[3]}
          </text>
          <text
            x="350"
            y="265"
            textAnchor="middle"
            className="text-sm fill-gray-500"
          >
            {labels[4]}
          </text>

          {/* Center point - You */}
          <g>
            <circle
              cx="350"
              cy="350"
              r="30"
              fill="white"
              stroke="#2563eb"
              strokeWidth="2"
            />
            <text
              x="350"
              y="355"
              textAnchor="middle"
              className="text-sm font-medium"
            >
              Ich
            </text>
          </g>

          {/* People nodes */}
          {circles.map((person) => (
            <g
              key={person.id}
              onClick={() => onEditPerson?.(person)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <circle
                cx={person.x}
                cy={person.y}
                r="35"
                fill="white"
                stroke="#93c5fd"
                strokeWidth="2"
              />
              <text
                x={person.x}
                y={person.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm"
              >
                <tspan>
                  {person.name.length > 10
                    ? `${person.name.slice(0, 8)}...`
                    : person.name}
                </tspan>
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Details</h3>
          <div className="text-left">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Funktion</TableHead>
                  <TableHead>Setting</TableHead>
                  <TableHead>Gelerntes</TableHead>
                  <TableHead>Bedeutsamkeit</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person) => (
                  <TableRow
                    key={person.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onEditPerson?.(person)}
                  >
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.function}</TableCell>
                    <TableCell>{person.setting}</TableCell>
                    <TableCell>{person.learningOutcome}</TableCell>
                    <TableCell>
                      {
                        labels[
                          Number(person.significance) as keyof typeof labels
                        ]
                      }
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPerson?.(person);
                        }}
                        aria-label="Person bearbeiten"
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePerson?.(person.id);
                        }}
                        aria-label="Person löschen"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

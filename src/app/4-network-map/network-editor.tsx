'use client';

import { NetworkVisualization } from '@/components/network-visualization';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { Person } from '@/types/network-map';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { saveNetworkMap } from './actions';

export const NetworkEditor = ({
  initialPeople,
}: {
  initialPeople: Person[];
}) => {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [open, setOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const handleAddPerson = async (newPerson: Omit<Person, 'id'>) => {
    const person: Person = {
      ...newPerson,
      id: `person-${people.length + 1}`,
    };
    const updatedPeople = [...people, person];
    setPeople(updatedPeople);
    setOpen(false);

    // Save to database
    try {
      await saveNetworkMap(updatedPeople);
    } catch (error) {
      console.error('Failed to save network map:', error);
      // You might want to show an error toast here
    }
  };

  const handleEditPerson = async (editedPerson: Omit<Person, 'id'>) => {
    const updatedPeople = people.map((p) =>
      p.id === editingPerson?.id ? { ...editedPerson, id: p.id } : p
    );
    setPeople(updatedPeople);
    setOpen(false);
    setEditingPerson(null);

    // Save to database
    try {
      await saveNetworkMap(updatedPeople);
    } catch (error) {
      console.error('Failed to save network map:', error);
    }
  };

  const handleDeletePerson = async (personId: string) => {
    const updatedPeople = people.filter((p) => p.id !== personId);
    setPeople(updatedPeople);

    // Save to database
    try {
      await saveNetworkMap(updatedPeople);
    } catch (error) {
      console.error('Failed to save network map after deletion:', error);
      // Optionally, revert the state or show an error message
    }
  };

  const handleOpenEdit = (person: Person) => {
    setEditingPerson(person);
    setOpen(true);
  };

  return (
    <div className="container mx-auto p-2 space-y-8">
      <div className="flex w-full items-center justify-center">
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setEditingPerson(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Person hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingPerson ? 'Person bearbeiten' : 'Neue Person hinzufügen'}
              </DialogTitle>
            </DialogHeader>
            <PersonForm
              initialData={editingPerson || undefined}
              onSubmit={editingPerson ? handleEditPerson : handleAddPerson}
              onCancel={() => {
                setOpen(false);
                setEditingPerson(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      <NetworkVisualization
        people={people}
        onEditPerson={handleOpenEdit}
        onDeletePerson={handleDeletePerson}
      />
    </div>
  );
};

const PersonForm = ({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Person;
  onSubmit: (person: Omit<Person, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<
    Omit<Person, 'id' | 'significance'> & {
      significance: Person['significance'] | undefined;
    }
  >({
    name: initialData?.name || '',
    function: initialData?.function || '',
    setting: initialData?.setting || '',
    learningOutcome: initialData?.learningOutcome || '',
    significance: initialData?.significance,
  });
  const [formErrors, setFormErrors] = useState<{
    significance?: string;
    name?: string;
    function?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof formErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Bitte geben Sie einen Namen ein';
    }

    if (!formData.function.trim()) {
      newErrors.function = 'Bitte geben Sie eine Funktion ein';
    }

    if (!formData.significance) {
      newErrors.significance = 'Bitte wählen Sie eine Option aus';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    onSubmit(formData as Omit<Person, 'id'>);

    setFormData({
      name: '',
      function: '',
      setting: '',
      learningOutcome: '',
      significance: undefined,
    });
    setFormErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="personName"
          className={formErrors.name ? 'text-destructive' : ''}
        >
          Von wem haben Sie etwas zu lernzentrierter Kooperation gelernt?
        </Label>
        <div className="space-y-2">
          <Input
            id="personName"
            placeholder="Name der Person"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) {
                setFormErrors({ ...formErrors, name: undefined });
              }
            }}
            className={formErrors.name ? 'border-red-500' : ''}
          />
          {formErrors.name && (
            <p className="text-sm text-red-500">{formErrors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Input
            id="personFunction"
            placeholder="Funktion der Person (z.B. Dozent:in, Praxislehrperson, Mitstudent:in)"
            value={formData.function}
            onChange={(e) => {
              setFormData({ ...formData, function: e.target.value });
              if (formErrors.function) {
                setFormErrors({ ...formErrors, function: undefined });
              }
            }}
            className={formErrors.function ? 'border-red-500' : ''}
          />
          {formErrors.function && (
            <p className="text-sm text-red-500">{formErrors.function}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="setting">
          In welchem Setting fand Ihre Lerngelegenheit statt (Seminar,
          Vorlesung, Praktikum, Pausengespräch etc.)?
        </Label>
        <Input
          id="setting"
          value={formData.setting}
          onChange={(e) =>
            setFormData({ ...formData, setting: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="learningOutcome">
          Was haben Sie für Ihre zukünftige Tätigkeit als Lehrperson gelernt?
          (Stichpunkte)
        </Label>
        <Textarea
          id="learningOutcome"
          value={formData.learningOutcome}
          onChange={(e) =>
            setFormData({ ...formData, learningOutcome: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label className={formErrors.significance ? 'text-red-500' : ''}>
          Wie bedeutsam schätzen Sie diese Lerngelegenheit für Ihre
          Kompetenzentwicklung ein?
        </Label>
        <RadioGroup
          value={formData.significance?.toString()}
          onValueChange={(value) => {
            setFormData({
              ...formData,
              significance: parseInt(value) as Person['significance'],
            });
            if (formErrors.significance) {
              setFormErrors({ ...formErrors, significance: undefined });
            }
          }}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="low" />
            <Label htmlFor="low">Wenig bedeutsam</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3" id="moderate" />
            <Label htmlFor="moderate">Bedeutsam</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="4" id="very" />
            <Label htmlFor="very">Sehr bedeutsam</Label>
          </div>
        </RadioGroup>
        {formErrors.significance && (
          <p className="text-sm text-red-500">{formErrors.significance}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {initialData ? 'Speichern' : 'Person hinzufügen'}
        </Button>
        <Button type="reset" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
};

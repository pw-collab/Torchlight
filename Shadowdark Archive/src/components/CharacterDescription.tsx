import React from 'react';
import { Character } from '../types';
import { Plus, X } from 'lucide-react';

interface CharacterDescriptionProps {
  character: Character;
  onUpdateCharacter?: (updates: Partial<Character>) => void;
}

export default function CharacterDescription({ character, onUpdateCharacter }: CharacterDescriptionProps) {
  const updateField = (field: string, value: any) => {
    if (onUpdateCharacter) {
      onUpdateCharacter({ [field]: value });
    }
  };

  const updateNestedField = (parent: 'backgroundDetails' | 'relations' | 'impulses', field: string, value: any) => {
    if (onUpdateCharacter) {
      onUpdateCharacter({
        [parent]: {
          ...(character[parent] || {}),
          [field]: value
        }
      });
    }
  };

  const addArrayItem = (parent: 'relations' | null, field: string) => {
    if (parent) {
      const currentArray = (character[parent] as any)?.[field] || [];
      updateNestedField(parent, field, [...currentArray, '']);
    } else {
      const currentArray = (character as any)[field] || [];
      updateField(field, [...currentArray, '']);
    }
  };

  const updateArrayItem = (parent: 'relations' | null, field: string, index: number, value: string) => {
    if (parent) {
      const currentArray = [...((character[parent] as any)?.[field] || [])];
      currentArray[index] = value;
      updateNestedField(parent, field, currentArray);
    } else {
      const currentArray = [...((character as any)[field] || [])];
      currentArray[index] = value;
      updateField(field, currentArray);
    }
  };

  const removeArrayItem = (parent: 'relations' | null, field: string, index: number) => {
    if (parent) {
      const currentArray = [...((character[parent] as any)?.[field] || [])];
      currentArray.splice(index, 1);
      updateNestedField(parent, field, currentArray);
    } else {
      const currentArray = [...((character as any)[field] || [])];
      currentArray.splice(index, 1);
      updateField(field, currentArray);
    }
  };

  const renderArrayField = (title: string, parent: 'relations' | null, field: string) => {
    const items = parent ? ((character[parent] as any)?.[field] || []) : ((character as any)[field] || []);
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">{title}</label>
          <button 
            onClick={() => addArrayItem(parent, field)}
            className="btn-secondary p-1"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <input 
                type="text"
                value={item}
                onChange={(e) => updateArrayItem(parent, field, idx, e.target.value)}
                className="flex-1 bg-surface-container-low/50 text-sm p-2 focus:outline-none hand-drawn-border font-body"
              />
              <button 
                onClick={() => removeArrayItem(parent, field, idx)}
                className="p-2 text-on-surface-variant hover:text-error transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-xs text-on-surface-variant/50 italic py-2">No entries yet.</div>
          )}
        </div>
      </div>
    );
  };

  const renderTextField = (title: string, parent: 'backgroundDetails' | 'relations' | 'impulses' | null, field: string, isTextArea: boolean = false, linkField?: string) => {
    const value = parent ? ((character[parent] as any)?.[field] || '') : ((character as any)[field] || '');
    const linkValue = linkField ? (parent ? ((character[parent] as any)?.[linkField] || '') : ((character as any)[linkField] || '')) : '';
    
    return (
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-label">{title}</label>
        {isTextArea ? (
          <textarea 
            value={value}
            onChange={(e) => parent ? updateNestedField(parent, field, e.target.value) : updateField(field, e.target.value)}
            rows={3}
            className="w-full bg-surface-container-low/50 text-sm p-3 focus:outline-none hand-drawn-border font-body resize-y"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <input 
              type="text"
              value={value}
              onChange={(e) => parent ? updateNestedField(parent, field, e.target.value) : updateField(field, e.target.value)}
              className="w-full bg-surface-container-low/50 text-sm p-3 focus:outline-none hand-drawn-border font-body"
            />
            {linkField && (
              <input 
                type="text"
                value={linkValue}
                placeholder="Link URL (optional)"
                onChange={(e) => parent ? updateNestedField(parent, linkField, e.target.value) : updateField(linkField, e.target.value)}
                className="w-full bg-surface-container-low/20 text-xs p-2 focus:outline-none hand-drawn-border font-body italic text-primary/80"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="tarot-card p-6">
        <h3 className="font-headline text-xl text-primary mb-4 uppercase tracking-widest border-b border-outline-variant/30 pb-2">Knowledge</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            {renderArrayField('Languages', null, 'languages')}
          </div>
          <div>
            {renderArrayField('Knowledge Areas', null, 'knowledge')}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTextField('Origin Domain', null, 'originDomain', false, 'originDomainLink')}
          {renderTextField('Faith / Deity', null, 'deity', false, 'deityLink')}
        </div>
      </div>

      <div className="tarot-card p-6">
        <h3 className="font-headline text-xl text-primary mb-4 uppercase tracking-widest border-b border-outline-variant/30 pb-2">Background</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTextField('Concept', 'backgroundDetails', 'concept', true)}
          {renderTextField('Origin', 'backgroundDetails', 'origin', true)}
        </div>
        {renderTextField('Backstory', 'backgroundDetails', 'backstory', true)}
        {renderTextField('Traumatic Events', 'backgroundDetails', 'traumaticEvents', true)}
      </div>

      <div className="tarot-card p-6">
        <h3 className="font-headline text-xl text-primary mb-4 uppercase tracking-widest border-b border-outline-variant/30 pb-2">Relations and Connections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {renderArrayField('Family Members', 'relations', 'family')}
            {renderArrayField('Allies', 'relations', 'allies')}
          </div>
          <div>
            {renderArrayField('Rivals', 'relations', 'rivals')}
            {renderTextField('Faction or Society', 'relations', 'faction')}
          </div>
        </div>
      </div>

      <div className="tarot-card p-6">
        <h3 className="font-headline text-xl text-primary mb-4 uppercase tracking-widest border-b border-outline-variant/30 pb-2">Impulses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTextField('Secrets', 'impulses', 'secrets', true)}
          {renderTextField('Flaws', 'impulses', 'flaws', true)}
          {renderTextField('Fears', 'impulses', 'fears', true)}
          {renderTextField('Objectives', 'impulses', 'objectives', true)}
        </div>
      </div>
    </div>
  );
}

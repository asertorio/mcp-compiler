import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, X as XIcon } from 'lucide-react';

interface SchemaFieldsEditorProps {
  value: any;
  onChange: (value: any) => void;
  toolPath?: string;      // e.g., "/users/{userId}/posts/{postId}"
  toolMethod?: string;    // e.g., "GET", "POST"
}

interface PropertyField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  // String validations
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // Number validations
  minimum?: number;
  maximum?: number;
  // Custom fields
  customFields: Record<string, any>;
  // Nested properties (for object type)
  nestedProperties?: PropertyField[];
  // Array items schema (for array type)
  itemsSchema?: any; // Can be a simple type or a complex schema
}

export function SchemaFieldsEditor({ value, onChange, toolPath, toolMethod }: SchemaFieldsEditorProps) {
  const [properties, setProperties] = useState<PropertyField[]>([]);
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set());
  
  // Extract path parameters from the tool path
  const pathParams = toolPath ? (toolPath.match(/\{([^}]+)\}/g) || []).map(p => p.slice(1, -1)) : [];
  const isGetRequest = toolMethod === 'GET';
  
  // Recursive function to parse a schema property into PropertyField
  const parsePropertyField = (name: string, propDef: any, isRequired: boolean): PropertyField => {
    const field: PropertyField = {
      name,
      type: propDef.type || 'string',
      description: propDef.description,
      required: isRequired,
      customFields: {}
    };

    // Extract validation fields based on type
    if (field.type === 'string') {
      if (propDef.minLength !== undefined) field.minLength = propDef.minLength;
      if (propDef.maxLength !== undefined) field.maxLength = propDef.maxLength;
      if (propDef.pattern !== undefined) field.pattern = propDef.pattern;
    } else if (field.type === 'number' || field.type === 'integer') {
      if (propDef.minimum !== undefined) field.minimum = propDef.minimum;
      if (propDef.maximum !== undefined) field.maximum = propDef.maximum;
    }

    // Handle nested object properties
    if (field.type === 'object' && propDef.properties) {
      const nestedRequired = propDef.required || [];
      field.nestedProperties = Object.entries(propDef.properties).map(([nestedName, nestedDef]: [string, any]) => 
        parsePropertyField(nestedName, nestedDef, nestedRequired.includes(nestedName))
      );
    }

    // Handle array items
    if (field.type === 'array' && propDef.items) {
      field.itemsSchema = propDef.items;
    }

    // Extract custom fields (x-* prefix or other unknown fields)
    Object.entries(propDef).forEach(([key, val]) => {
      const knownFields = ['type', 'description', 'minLength', 'maxLength', 'pattern', 'minimum', 'maximum', 'properties', 'required', 'items'];
      if (!knownFields.includes(key)) {
        field.customFields[key] = val;
      }
    });

    return field;
  };
  
  // Parse schema into property fields
  useEffect(() => {
    if (!value || typeof value !== 'object') {
      setProperties([]);
      return;
    }

    const props = value.properties || {};
    const required = value.required || [];
    
    const fields: PropertyField[] = Object.entries(props).map(([name, propDef]: [string, any]) => 
      parsePropertyField(name, propDef, required.includes(name))
    );
    
    // Check if any path parameters from the URL are missing from the schema
    // If so, add them automatically
    const missingPathParams = pathParams.filter(param => !fields.some(f => f.name === param));
    if (missingPathParams.length > 0) {
      const updatedSchema = {
        ...value,
        type: 'object',
        properties: {
          ...props
        },
        required: [...required]
      };
      
      missingPathParams.forEach(param => {
        updatedSchema.properties[param] = {
          type: 'string',
          description: `Path parameter: ${param}`
        };
        if (!updatedSchema.required.includes(param)) {
          updatedSchema.required.push(param);
        }
      });
      
      // Update the parent with the corrected schema
      onChange(updatedSchema);
      return;
    }

    setProperties(fields);
  }, [value, pathParams]);

  // Convert property fields back to schema (recursive)
  const buildPropertySchema = (field: PropertyField): any => {
    const propDef: any = {
      type: field.type
    };

    if (field.description) {
      propDef.description = field.description;
    }

    // Add validation fields based on type
    if (field.type === 'string') {
      if (field.minLength !== undefined) propDef.minLength = field.minLength;
      if (field.maxLength !== undefined) propDef.maxLength = field.maxLength;
      if (field.pattern) propDef.pattern = field.pattern;
    } else if (field.type === 'number' || field.type === 'integer') {
      if (field.minimum !== undefined) propDef.minimum = field.minimum;
      if (field.maximum !== undefined) propDef.maximum = field.maximum;
    }

    // Handle nested object properties
    if (field.type === 'object' && field.nestedProperties && field.nestedProperties.length > 0) {
      propDef.properties = {};
      propDef.required = [];
      
      field.nestedProperties.forEach(nestedField => {
        propDef.properties[nestedField.name] = buildPropertySchema(nestedField);
        if (nestedField.required) {
          propDef.required.push(nestedField.name);
        }
      });
      
      if (propDef.required.length === 0) {
        delete propDef.required;
      }
    }

    // Handle array items
    if (field.type === 'array' && field.itemsSchema) {
      propDef.items = field.itemsSchema;
    }

    // Add custom fields
    Object.entries(field.customFields).forEach(([key, val]) => {
      propDef[key] = val;
    });

    return propDef;
  };

  const buildSchema = (fields: PropertyField[]) => {
    const schema: any = {
      type: 'object',
      properties: {},
      required: []
    };

    fields.forEach(field => {
      schema.properties[field.name] = buildPropertySchema(field);

      if (field.required) {
        schema.required.push(field.name);
      }
    });

    return schema;
  };

  const handleAddProperty = () => {
    const newProp: PropertyField = {
      name: `property${properties.length + 1}`,
      type: 'string',
      required: false,
      customFields: {}
    };
    const newProps = [...properties, newProp];
    setProperties(newProps);
    setExpandedProps(new Set([...expandedProps, newProp.name]));
    onChange(buildSchema(newProps));
  };

  const handleDeleteProperty = (index: number) => {
    const newProps = properties.filter((_, i) => i !== index);
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const handleUpdateProperty = (index: number, updates: Partial<PropertyField>) => {
    const newProps = [...properties];
    const oldName = newProps[index].name;
    newProps[index] = { ...newProps[index], ...updates };
    
    // If name changed, update expanded state
    if (updates.name && updates.name !== oldName) {
      const newExpanded = new Set(expandedProps);
      if (newExpanded.has(oldName)) {
        newExpanded.delete(oldName);
        newExpanded.add(updates.name);
      }
      setExpandedProps(newExpanded);
    }
    
    // If type changed, clear incompatible validation fields
    if (updates.type && updates.type !== newProps[index].type) {
      if (updates.type !== 'string') {
        delete newProps[index].minLength;
        delete newProps[index].maxLength;
        delete newProps[index].pattern;
      }
      if (updates.type !== 'number' && updates.type !== 'integer') {
        delete newProps[index].minimum;
        delete newProps[index].maximum;
      }
    }
    
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const handleAddCustomField = (propIndex: number) => {
    const newProps = [...properties];
    const customKey = `x-custom${Object.keys(newProps[propIndex].customFields).length + 1}`;
    newProps[propIndex].customFields[customKey] = '';
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const handleUpdateCustomField = (propIndex: number, oldKey: string, newKey: string, value: any) => {
    const newProps = [...properties];
    const customFields = { ...newProps[propIndex].customFields };
    
    if (oldKey !== newKey) {
      delete customFields[oldKey];
    }
    customFields[newKey] = value;
    
    newProps[propIndex].customFields = customFields;
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const handleDeleteCustomField = (propIndex: number, key: string) => {
    const newProps = [...properties];
    const customFields = { ...newProps[propIndex].customFields };
    delete customFields[key];
    newProps[propIndex].customFields = customFields;
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  // Nested property handlers
  const handleAddNestedProperty = (parentIndex: number) => {
    const newProps = [...properties];
    const parent = newProps[parentIndex];
    
    if (!parent.nestedProperties) {
      parent.nestedProperties = [];
    }
    
    const newNestedProp: PropertyField = {
      name: `nestedProp${parent.nestedProperties.length + 1}`,
      type: 'string',
      required: false,
      customFields: {}
    };
    
    parent.nestedProperties = [...parent.nestedProperties, newNestedProp];
    setProperties(newProps);
    setExpandedProps(new Set([...expandedProps, `${parent.name}.${newNestedProp.name}`]));
    onChange(buildSchema(newProps));
  };

  const handleUpdateNestedProperty = (parentIndex: number, nestedIndex: number, updates: Partial<PropertyField>) => {
    const newProps = [...properties];
    const parent = newProps[parentIndex];
    
    if (!parent.nestedProperties) return;
    
    const oldName = parent.nestedProperties[nestedIndex].name;
    parent.nestedProperties[nestedIndex] = { ...parent.nestedProperties[nestedIndex], ...updates };
    
    // If name changed, update expanded state
    if (updates.name && updates.name !== oldName) {
      const newExpanded = new Set(expandedProps);
      const oldKey = `${parent.name}.${oldName}`;
      const newKey = `${parent.name}.${updates.name}`;
      if (newExpanded.has(oldKey)) {
        newExpanded.delete(oldKey);
        newExpanded.add(newKey);
      }
      setExpandedProps(newExpanded);
    }
    
    // If type changed, clear incompatible validation fields
    if (updates.type && updates.type !== parent.nestedProperties[nestedIndex].type) {
      if (updates.type !== 'string') {
        delete parent.nestedProperties[nestedIndex].minLength;
        delete parent.nestedProperties[nestedIndex].maxLength;
        delete parent.nestedProperties[nestedIndex].pattern;
      }
      if (updates.type !== 'number' && updates.type !== 'integer') {
        delete parent.nestedProperties[nestedIndex].minimum;
        delete parent.nestedProperties[nestedIndex].maximum;
      }
    }
    
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const handleDeleteNestedProperty = (parentIndex: number, nestedIndex: number) => {
    const newProps = [...properties];
    const parent = newProps[parentIndex];
    
    if (!parent.nestedProperties) return;
    
    parent.nestedProperties = parent.nestedProperties.filter((_, i) => i !== nestedIndex);
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const handleAddNestedCustomField = (parentIndex: number, nestedIndex: number) => {
    const newProps = [...properties];
    const parent = newProps[parentIndex];
    
    if (!parent.nestedProperties) return;
    
    const nestedProp = parent.nestedProperties[nestedIndex];
    const customKey = `x-custom${Object.keys(nestedProp.customFields).length + 1}`;
    nestedProp.customFields[customKey] = '';
    
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const handleUpdateNestedCustomField = (parentIndex: number, nestedIndex: number, oldKey: string, newKey: string, value: any) => {
    const newProps = [...properties];
    const parent = newProps[parentIndex];
    
    if (!parent.nestedProperties) return;
    
    const nestedProp = parent.nestedProperties[nestedIndex];
    const customFields = { ...nestedProp.customFields };
    
    if (oldKey !== newKey) {
      delete customFields[oldKey];
    }
    customFields[newKey] = value;
    
    nestedProp.customFields = customFields;
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const handleDeleteNestedCustomField = (parentIndex: number, nestedIndex: number, key: string) => {
    const newProps = [...properties];
    const parent = newProps[parentIndex];
    
    if (!parent.nestedProperties) return;
    
    const nestedProp = parent.nestedProperties[nestedIndex];
    const customFields = { ...nestedProp.customFields };
    delete customFields[key];
    nestedProp.customFields = customFields;
    
    setProperties(newProps);
    onChange(buildSchema(newProps));
  };

  const toggleExpanded = (propName: string) => {
    const newExpanded = new Set(expandedProps);
    if (newExpanded.has(propName)) {
      newExpanded.delete(propName);
    } else {
      newExpanded.add(propName);
    }
    setExpandedProps(newExpanded);
  };

  // Group properties by type
  const pathProperties = properties.filter(p => pathParams.includes(p.name));
  const bodyOrQueryProperties = properties.filter(p => !pathParams.includes(p.name));

  // Render nested property card (for child properties of objects)
  const renderNestedPropertyCard = (nestedProp: PropertyField, parentIndex: number, nestedIndex: number) => {
    const nestedKey = `${properties[parentIndex].name}.${nestedProp.name}`;
    const isExpanded = expandedProps.has(nestedKey);
    
    return (
      <div 
        key={nestedKey}
        style={{ 
          background: '#1e1e1e', 
          border: '1px solid #444', 
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}
      >
        {/* Nested Property Header */}
        <div 
          style={{ 
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#2d2d2d',
            cursor: 'pointer'
          }}
          onClick={() => toggleExpanded(nestedKey)}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          
          <input
            type="text"
            value={nestedProp.name}
            onChange={(e) => {
              e.stopPropagation();
              handleUpdateNestedProperty(parentIndex, nestedIndex, { name: e.target.value });
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              flex: 1,
              padding: '4px 6px',
              background: '#1a1a1a',
              border: '1px solid #555',
              color: '#fff',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }}
          />
          
          <select
            value={nestedProp.type}
            onChange={(e) => {
              e.stopPropagation();
              handleUpdateNestedProperty(parentIndex, nestedIndex, { type: e.target.value });
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              padding: '4px 6px',
              background: '#1a1a1a',
              border: '1px solid #555',
              color: '#fff',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="integer">integer</option>
            <option value="boolean">boolean</option>
            <option value="object">object</option>
            <option value="array">array</option>
          </select>

          <label 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={nestedProp.required}
              onChange={(e) => {
                e.stopPropagation();
                handleUpdateNestedProperty(parentIndex, nestedIndex, { required: e.target.checked });
              }}
              style={{ cursor: 'pointer' }}
            />
            Req
          </label>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteNestedProperty(parentIndex, nestedIndex);
            }}
            style={{ 
              background: 'transparent',
              border: 'none',
              color: '#f93e3e',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Delete Property"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Nested Property Details (Expanded) */}
        {isExpanded && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Description */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '0.8rem' }}>
                Description
              </label>
              <textarea
                value={nestedProp.description || ''}
                onChange={(e) => handleUpdateNestedProperty(parentIndex, nestedIndex, { description: e.target.value })}
                placeholder="Describe this parameter..."
                rows={2}
                style={{ 
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a1a',
                  border: '1px solid #555',
                  color: '#fff',
                  borderRadius: '3px',
                  fontSize: '0.85rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Type-specific Validations */}
            {nestedProp.type === 'string' && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '0.8rem' }}>
                  String Validation
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', marginBottom: '3px', color: '#888', fontSize: '0.75rem' }}>
                      Min Length
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={nestedProp.minLength ?? ''}
                      onChange={(e) => handleUpdateNestedProperty(parentIndex, nestedIndex, { 
                        minLength: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      placeholder="No min"
                      style={{ 
                        width: '100%',
                        padding: '4px',
                        background: '#1a1a1a',
                        border: '1px solid #555',
                        color: '#fff',
                        borderRadius: '3px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', marginBottom: '3px', color: '#888', fontSize: '0.75rem' }}>
                      Max Length
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={nestedProp.maxLength ?? ''}
                      onChange={(e) => handleUpdateNestedProperty(parentIndex, nestedIndex, { 
                        maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      placeholder="No max"
                      style={{ 
                        width: '100%',
                        padding: '4px',
                        background: '#1a1a1a',
                        border: '1px solid #555',
                        color: '#fff',
                        borderRadius: '3px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 100%' }}>
                    <label style={{ display: 'block', marginBottom: '3px', color: '#888', fontSize: '0.75rem' }}>
                      Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      value={nestedProp.pattern || ''}
                      onChange={(e) => handleUpdateNestedProperty(parentIndex, nestedIndex, { 
                        pattern: e.target.value || undefined 
                      })}
                      placeholder="e.g., ^[a-zA-Z0-9]+$"
                      style={{ 
                        width: '100%',
                        padding: '4px',
                        background: '#1a1a1a',
                        border: '1px solid #555',
                        color: '#fff',
                        borderRadius: '3px',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {(nestedProp.type === 'number' || nestedProp.type === 'integer') && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '0.8rem' }}>
                  Number Validation
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '3px', color: '#888', fontSize: '0.75rem' }}>
                      Minimum
                    </label>
                    <input
                      type="number"
                      value={nestedProp.minimum ?? ''}
                      onChange={(e) => handleUpdateNestedProperty(parentIndex, nestedIndex, { 
                        minimum: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      placeholder="No min"
                      style={{ 
                        width: '100%',
                        padding: '4px',
                        background: '#1a1a1a',
                        border: '1px solid #555',
                        color: '#fff',
                        borderRadius: '3px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '3px', color: '#888', fontSize: '0.75rem' }}>
                      Maximum
                    </label>
                    <input
                      type="number"
                      value={nestedProp.maximum ?? ''}
                      onChange={(e) => handleUpdateNestedProperty(parentIndex, nestedIndex, { 
                        maximum: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      placeholder="No max"
                      style={{ 
                        width: '100%',
                        padding: '4px',
                        background: '#1a1a1a',
                        border: '1px solid #555',
                        color: '#fff',
                        borderRadius: '3px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Fields for Nested Properties */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ color: '#aaa', fontSize: '0.8rem' }}>
                  Custom Fields
                </label>
                <button
                  onClick={() => handleAddNestedCustomField(parentIndex, nestedIndex)}
                  style={{ 
                    padding: '3px 6px',
                    background: '#007acc',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Plus size={10} />
                  Add
                </button>
              </div>

              {Object.entries(nestedProp.customFields).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(nestedProp.customFields).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => handleUpdateNestedCustomField(parentIndex, nestedIndex, key, e.target.value, val)}
                        placeholder="Field name"
                        style={{ 
                          flex: '0 0 140px',
                          padding: '4px',
                          background: '#1a1a1a',
                          border: '1px solid #555',
                          color: '#fff',
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem'
                        }}
                      />
                      <input
                        type="text"
                        value={typeof val === 'string' ? val : JSON.stringify(val)}
                        onChange={(e) => {
                          let parsedVal: any = e.target.value;
                          try {
                            parsedVal = JSON.parse(e.target.value);
                          } catch {
                            // Keep as string if not valid JSON
                          }
                          handleUpdateNestedCustomField(parentIndex, nestedIndex, key, key, parsedVal);
                        }}
                        placeholder="Value"
                        style={{ 
                          flex: 1,
                          padding: '4px',
                          background: '#1a1a1a',
                          border: '1px solid #555',
                          color: '#fff',
                          borderRadius: '3px',
                          fontSize: '0.8rem'
                        }}
                      />
                      <button
                        onClick={() => handleDeleteNestedCustomField(parentIndex, nestedIndex, key)}
                        style={{ 
                          background: 'transparent',
                          border: 'none',
                          color: '#f93e3e',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666', fontSize: '0.75rem', fontStyle: 'italic', margin: 0 }}>
                  No custom fields.
                </p>
              )}
            </div>

            {/* Recursively handle nested objects */}
            {nestedProp.type === 'object' && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '6px',
                  paddingTop: '8px',
                  borderTop: '1px solid #555'
                }}>
                  <label style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 600 }}>
                    Child Properties
                  </label>
                  <button
                    onClick={() => {
                      // For deeper nesting, we'd need to update the handler structure
                      // For now, show a message that deeper nesting is not yet supported
                      alert('Nested objects within nested objects are not yet supported in the UI. You can edit these in the Raw JSON editor.');
                    }}
                    style={{ 
                      padding: '3px 6px',
                      background: '#666',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '3px',
                      cursor: 'not-allowed',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      opacity: 0.6
                    }}
                    disabled
                  >
                    <Plus size={10} />
                    Add Child
                  </button>
                </div>
                <p style={{ color: '#888', fontSize: '0.75rem', fontStyle: 'italic', margin: 0 }}>
                  Deeper nesting not yet supported in visual editor. Use Raw JSON editor for complex nested structures.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPropertyCard = (prop: PropertyField, index: number, isPathParam: boolean, locationLabel?: string) => {
        const isExpanded = expandedProps.has(prop.name);
        
        return (
          <div 
            key={`${prop.name}-${index}`}
            style={{ 
              background: '#252526', 
              border: '1px solid #333', 
              borderRadius: '6px',
              overflow: 'hidden'
            }}
          >
            {/* Property Header */}
            <div 
              style={{ 
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#2a2a2a',
                cursor: 'pointer'
              }}
              onClick={() => toggleExpanded(prop.name)}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              
              {locationLabel && (
                <span style={{ 
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: isPathParam ? 'rgba(252, 161, 48, 0.2)' : (isGetRequest ? 'rgba(97, 175, 254, 0.2)' : 'rgba(73, 204, 144, 0.2)'),
                  color: isPathParam ? '#fca130' : (isGetRequest ? '#61affe' : '#49cc90'),
                  border: `1px solid ${isPathParam ? '#fca130' : (isGetRequest ? '#61affe' : '#49cc90')}`,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {locationLabel}
                </span>
              )}
              
              <input
                type="text"
                value={prop.name}
                onChange={(e) => {
                  e.stopPropagation();
                  handleUpdateProperty(index, { name: e.target.value });
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={isPathParam}
                style={{ 
                  flex: 1,
                  padding: '6px 8px',
                  background: isPathParam ? '#1a1a1a' : '#1e1e1e',
                  border: '1px solid #444',
                  color: isPathParam ? '#888' : '#fff',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  cursor: isPathParam ? 'not-allowed' : 'text'
                }}
                title={isPathParam ? 'Path parameter name is determined by the URL path' : ''}
              />
              
              <select
                value={prop.type}
                onChange={(e) => {
                  e.stopPropagation();
                  handleUpdateProperty(index, { type: e.target.value });
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  padding: '6px 8px',
                  background: '#1e1e1e',
                  border: '1px solid #444',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="integer">integer</option>
                <option value="boolean">boolean</option>
                <option value="object">object</option>
                <option value="array">array</option>
              </select>

              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={prop.required}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleUpdateProperty(index, { required: e.target.checked });
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Required
              </label>

              {!isPathParam && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProperty(index);
                  }}
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    color: '#f93e3e',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Delete Property"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Property Details (Expanded) */}
            {isExpanded && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Path Parameter Info */}
                {isPathParam && (
                  <div style={{ 
                    padding: '10px', 
                    background: 'rgba(252, 161, 48, 0.1)', 
                    border: '1px solid rgba(252, 161, 48, 0.3)', 
                    borderRadius: '4px', 
                    fontSize: '0.85rem', 
                    color: '#fca130' 
                  }}>
                    This is a path parameter extracted from the URL: <code style={{ background: '#1e1e1e', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>{toolPath}</code>
                  </div>
                )}
                
                {/* Description */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '0.85rem' }}>
                    Description
                  </label>
                  <textarea
                    value={prop.description || ''}
                    onChange={(e) => handleUpdateProperty(index, { description: e.target.value })}
                    placeholder="Describe this parameter for AI to understand its purpose..."
                    rows={2}
                    style={{ 
                      width: '100%',
                      padding: '8px',
                      background: '#1e1e1e',
                      border: '1px solid #444',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Type-specific Validations */}
                {(prop.type === 'string') && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '0.85rem' }}>
                      String Validation
                    </label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>
                          Min Length
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={prop.minLength ?? ''}
                          onChange={(e) => handleUpdateProperty(index, { 
                            minLength: e.target.value ? parseInt(e.target.value) : undefined 
                          })}
                          placeholder="No min"
                          style={{ 
                            width: '100%',
                            padding: '6px',
                            background: '#1e1e1e',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>
                          Max Length
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={prop.maxLength ?? ''}
                          onChange={(e) => handleUpdateProperty(index, { 
                            maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                          })}
                          placeholder="No max"
                          style={{ 
                            width: '100%',
                            padding: '6px',
                            background: '#1e1e1e',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div style={{ flex: '1 1 100%' }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>
                          Pattern (Regex)
                        </label>
                        <input
                          type="text"
                          value={prop.pattern || ''}
                          onChange={(e) => handleUpdateProperty(index, { 
                            pattern: e.target.value || undefined 
                          })}
                          placeholder="e.g., ^[a-zA-Z0-9]+$"
                          style={{ 
                            width: '100%',
                            padding: '6px',
                            background: '#1e1e1e',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: '4px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(prop.type === 'number' || prop.type === 'integer') && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '0.85rem' }}>
                      Number Validation
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>
                          Minimum
                        </label>
                        <input
                          type="number"
                          value={prop.minimum ?? ''}
                          onChange={(e) => handleUpdateProperty(index, { 
                            minimum: e.target.value ? parseFloat(e.target.value) : undefined 
                          })}
                          placeholder="No min"
                          style={{ 
                            width: '100%',
                            padding: '6px',
                            background: '#1e1e1e',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', color: '#888', fontSize: '0.8rem' }}>
                          Maximum
                        </label>
                        <input
                          type="number"
                          value={prop.maximum ?? ''}
                          onChange={(e) => handleUpdateProperty(index, { 
                            maximum: e.target.value ? parseFloat(e.target.value) : undefined 
                          })}
                          placeholder="No max"
                          style={{ 
                            width: '100%',
                            padding: '6px',
                            background: '#1e1e1e',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.85rem' }}>
                      Custom Fields
                    </label>
                    <button
                      onClick={() => handleAddCustomField(index)}
                      style={{ 
                        padding: '4px 8px',
                        background: '#007acc',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </div>

                  {Object.entries(prop.customFields).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(prop.customFields).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => handleUpdateCustomField(index, key, e.target.value, val)}
                            placeholder="Field name (e.g., x-example)"
                            style={{ 
                              flex: '0 0 180px',
                              padding: '6px',
                              background: '#1e1e1e',
                              border: '1px solid #444',
                              color: '#fff',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem'
                            }}
                          />
                          <input
                            type="text"
                            value={typeof val === 'string' ? val : JSON.stringify(val)}
                            onChange={(e) => {
                              let parsedVal: any = e.target.value;
                              // Try to parse as JSON for complex values
                              try {
                                parsedVal = JSON.parse(e.target.value);
                              } catch {
                                // Keep as string if not valid JSON
                              }
                              handleUpdateCustomField(index, key, key, parsedVal);
                            }}
                            placeholder="Value"
                            style={{ 
                              flex: 1,
                              padding: '6px',
                              background: '#1e1e1e',
                              border: '1px solid #444',
                              color: '#fff',
                              borderRadius: '4px',
                              fontSize: '0.85rem'
                            }}
                          />
                          <button
                            onClick={() => handleDeleteCustomField(index, key)}
                            style={{ 
                              background: 'transparent',
                              border: 'none',
                              color: '#f93e3e',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>
                      No custom fields. Click "Add" to add extended metadata.
                    </p>
                  )}
                </div>

                {/* Nested Properties (for object type) */}
                {prop.type === 'object' && (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      paddingTop: '12px',
                      borderTop: '1px solid #444'
                    }}>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 600 }}>
                        Child Properties
                      </label>
                      <button
                        onClick={() => handleAddNestedProperty(index)}
                        style={{ 
                          padding: '4px 8px',
                          background: '#49cc90',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={12} />
                        Add Child
                      </button>
                    </div>

                    {prop.nestedProperties && prop.nestedProperties.length > 0 ? (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px',
                        paddingLeft: '16px',
                        borderLeft: '2px solid #49cc90'
                      }}>
                        {prop.nestedProperties.map((nestedProp, nestedIdx) => 
                          renderNestedPropertyCard(nestedProp, index, nestedIdx)
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>
                        No child properties. Click "Add Child" to define nested properties for this object.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      };

  if (properties.length === 0 && pathParams.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: '#252526', borderRadius: '4px', border: '1px solid #333' }}>
        <p style={{ color: '#888', marginBottom: '15px' }}>No properties defined yet. Add properties to define the input schema for this tool.</p>
        <button
          onClick={handleAddProperty}
          style={{ 
            padding: '8px 16px', 
            background: '#007acc', 
            border: 'none', 
            color: '#fff', 
            borderRadius: '4px', 
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          Add Property
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Path Parameters Section */}
      {pathProperties.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '2px solid #fca130'
          }}>
            <h4 style={{ margin: 0, color: '#fca130', fontSize: '0.95rem', fontWeight: 600 }}>
              PATH PARAMETERS
            </h4>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              (from URL path)
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pathProperties.map((prop, idx) => {
              const originalIndex = properties.findIndex(p => p.name === prop.name);
              return renderPropertyCard(prop, originalIndex, true, 'PATH');
            })}
          </div>
        </div>
      )}

      {/* Query/Body Parameters Section */}
      {bodyOrQueryProperties.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `2px solid ${isGetRequest ? '#61affe' : '#49cc90'}`
          }}>
            <h4 style={{ margin: 0, color: isGetRequest ? '#61affe' : '#49cc90', fontSize: '0.95rem', fontWeight: 600 }}>
              {isGetRequest ? 'QUERY PARAMETERS' : 'BODY PARAMETERS'}
            </h4>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              ({isGetRequest ? 'URL query string' : 'request body JSON'})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bodyOrQueryProperties.map((prop, idx) => {
              const originalIndex = properties.findIndex(p => p.name === prop.name);
              return renderPropertyCard(prop, originalIndex, false, isGetRequest ? 'QUERY' : 'BODY');
            })}
          </div>
        </div>
      )}

      {/* Add Property Button - only for body/query params */}
      <button
        onClick={handleAddProperty}
        style={{ 
          padding: '10px',
          background: '#007acc',
          border: 'none',
          color: '#fff',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '0.9rem'
        }}
      >
        <Plus size={16} />
        Add {isGetRequest ? 'Query' : 'Body'} Parameter
      </button>
      
      {/* Info about path parameters */}
      {pathParams.length > 0 && (
        <div style={{ 
          padding: '10px', 
          background: 'rgba(97, 175, 254, 0.1)', 
          border: '1px solid rgba(97, 175, 254, 0.3)', 
          borderRadius: '4px', 
          fontSize: '0.85rem', 
          color: '#61affe' 
        }}>
          💡 Path parameters are automatically detected from your URL path template. To add or remove path parameters, edit the Path field in the HTTP tab.
        </div>
      )}
    </div>
  );
}

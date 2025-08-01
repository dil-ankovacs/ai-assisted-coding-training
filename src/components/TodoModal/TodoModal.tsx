import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useTodo } from '../../hooks/useTodo';
// Todo type is used in the context, no need to import it directly here

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialValues?: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
  };
}

export const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  mode = 'create',
  initialValues,
}) => {
  const { addTodo, editTodo } = useTodo();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completed, setCompleted] = useState(false);
  const [titleError, setTitleError] = useState('');

  // Reset form or load values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialValues) {
        setTitle(initialValues.title);
        setDescription(initialValues.description);
        setCompleted(initialValues.completed);
      } else {
        setTitle('');
        setDescription('');
        setCompleted(false);
      }
      setTitleError('');
    }
  }, [isOpen, mode, initialValues]);

  const validateForm = () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (mode === 'create') {
      addTodo(title.trim(), description.trim());
    } else if (mode === 'edit' && initialValues) {
      editTodo(initialValues.id, {
        title: title.trim(),
        description: description.trim(),
        completed,
      });
    }
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="todo-dialog-title"
    >
      <DialogTitle id="todo-dialog-title">
        {mode === 'create' ? 'Create Todo' : 'Edit Todo'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError('');
              }}
              fullWidth
              required
              error={!!titleError}
              helperText={titleError}
              autoFocus
              inputProps={
                { 'data-testid': 'title-input' } as React.InputHTMLAttributes<HTMLInputElement>
              }
            />
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
              inputProps={
                {
                  'data-testid': 'description-input',
                } as React.InputHTMLAttributes<HTMLInputElement>
              }
            />
            {mode === 'edit' && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={completed}
                    onChange={e => setCompleted(e.target.checked)}
                    inputProps={
                      {
                        'data-testid': 'completed-checkbox',
                      } as React.InputHTMLAttributes<HTMLInputElement>
                    }
                  />
                }
                label="Mark as completed"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" data-testid="submit-button">
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

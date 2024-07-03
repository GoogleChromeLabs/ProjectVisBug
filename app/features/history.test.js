import test from 'ava'
import { EditType, clearHistory, history, redo, addToHistory, undoLastEvent, redoLastEvent } from './history';

import { setupPptrTab, teardownPptrTab }
    from '../../tests/helpers'

test.beforeEach(setupPptrTab)
test.afterEach(teardownPptrTab)

// Note: I had to comment out applyEvent to run. Should mock document.

let mockEvent, mockEvent1;
test.beforeEach(() => {
    mockEvent = {
        createdAt: new Date().toISOString(),
        selector: '.test',
        editType: EditType.STYLE,
        newVal: { 'color': 'red' },
        oldVal: { 'color': 'blue' },
    };

    mockEvent1 = {
        createdAt: new Date().toISOString(),
        selector: '.test1',
        editType: EditType.STYLE,
        newVal: { 'color': 'red1' },
        oldVal: { 'color': 'blue1' },
    };
});

test('addToHistory adds an event to the history', t => {
    clearHistory()
    addToHistory(mockEvent);
    t.is(history.length, 1);
    t.deepEqual(history[0], mockEvent);
});

test('addToHistory deduplicates events in history', t => {
    clearHistory()
    addToHistory(mockEvent);
    addToHistory(mockEvent);
    addToHistory(mockEvent1);
    addToHistory(mockEvent1);
    t.is(history.length, 2);
    t.deepEqual(history[0], mockEvent);
    t.deepEqual(history[1], mockEvent1);
});

test('addToHistory deduplicates events in history if multiple', t => {
    clearHistory()
    addToHistory(mockEvent);
    addToHistory(mockEvent1);
    addToHistory(mockEvent1);
    addToHistory(mockEvent);
    addToHistory(mockEvent);
    t.is(history.length, 3);
    t.deepEqual(history[0], mockEvent);
    t.deepEqual(history[1], mockEvent1);
    t.deepEqual(history[2], mockEvent);
});

test('undoLastEvent moves the last event from history to redo', t => {
    clearHistory()
    // Add to history and then undo
    addToHistory(mockEvent);
    undoLastEvent();
    t.is(history.length, 0);
    t.is(redo.length, 1);
});

test('redoLastEvent moves the last event from redo to history', t => {
    clearHistory()
    // Manually simulate an undo action
    addToHistory(mockEvent);
    undoLastEvent();
    redoLastEvent();
    t.is(history.length, 1);
    t.is(redo.length, 0);
});
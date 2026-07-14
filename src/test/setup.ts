// Import reflect-metadata globally before any TypeORM entities are loaded.
// This is required by TypeORM when using decorators in a Node.js test environment.
import 'reflect-metadata';

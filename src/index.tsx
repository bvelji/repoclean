#!/usr/bin/env node
import path from 'path';
import { render } from 'ink';
import { App } from './components/App.js';

const arg = process.argv[2];
const reposDir = arg ? path.resolve(arg) : undefined;

render(<App reposDir={reposDir} />);

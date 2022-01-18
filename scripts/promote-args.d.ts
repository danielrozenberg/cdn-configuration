import {ParsedArgs} from 'minimist';

interface Args extends ParsedArgs {
  amp_version?: string;
  auto_merge?: string;
}

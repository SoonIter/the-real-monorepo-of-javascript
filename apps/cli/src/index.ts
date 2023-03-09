import { sdk } from '@real-monorepo/sdk';
import { add } from '@real-monorepo/util';

sdk();
console.log('cli', add(1, 2));

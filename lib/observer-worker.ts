import {runObserverChecks} from './observer-experiment';
self.onmessage=async(event:MessageEvent)=>{if(event.data==='run')self.postMessage(await runObserverChecks());};

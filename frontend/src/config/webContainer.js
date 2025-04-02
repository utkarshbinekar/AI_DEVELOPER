import { WebContainer } from '@webcontainer/api';

// Call only once
let webcontainerInstance = null;

export const getWebContainer = async () => {
    if (!webcontainerInstance) {
        webcontainerInstance = await WebContainer.boot();
    }
    return webcontainerInstance;
}

import { parseNarrative } from './narrativeParser';
import { getNarrativeMappings } from './storyConfig';

// Fetch and Parse
export async function fetchNarrativeData() {
    try {
        // Cache-busting: ?t=timestamp
        const response = await fetch(`/api/narrative?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch narrative: ${response.statusText}`);
        }
        const text = await response.text();
        const parsedItems = parseNarrative(text);
        const narrativeMappings = getNarrativeMappings();

        return {
            items: parsedItems.map(item => {
                if (item.type === 'card' && narrativeMappings[item.id]) {
                    item.triggerAfter = narrativeMappings[item.id];
                }
                return item;
            })
        };
    } catch (error) {
        console.error("Error loading narrative:", error);
        return { items: [] }; // Return empty or handle error gracefully
    }
}


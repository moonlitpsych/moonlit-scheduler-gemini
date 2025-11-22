// Simulating the fix for Availability Cache Failures
// Issue: Cache would return empty for future dates instead of triggering a refresh

interface CacheEntry {
    timestamp: number;
    data: any[];
    dateRange: { start: string; end: string };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes standard TTL
const EMPTY_CACHE_TTL = 30 * 1000; // 30 seconds TTL for empty results (FIX)

const availabilityCache = new Map<string, CacheEntry>();

export const getMergedAvailability = async (
    providerId: string, 
    startDate: string, 
    endDate: string
) => {
    const cacheKey = `${providerId}_${startDate}_${endDate}`;
    const now = Date.now();
    const entry = availabilityCache.get(cacheKey);

    // FIX: Improved cache validation logic
    // If we have an entry, we check if it is still valid.
    // We treat empty results with a much shorter TTL to prevent "No Availability" sticking
    // when slots might have just been added.
    if (entry) {
        const isExpired = (now - entry.timestamp) > CACHE_TTL;
        
        // Logic: If data is empty AND it's been more than 30s, treat it as stale
        const isEmptyAndStale = (entry.data.length === 0) && ((now - entry.timestamp) > EMPTY_CACHE_TTL);
        
        if (!isExpired && !isEmptyAndStale) {
            console.log('[AvailabilityCache] Cache hit for', cacheKey, `(${entry.data.length} slots)`);
            return entry.data;
        }
        
        if (isEmptyAndStale) {
            console.log('[AvailabilityCache] Cache hit but empty result is stale (Short TTL), refreshing...', cacheKey);
        } else if (isExpired) {
             console.log('[AvailabilityCache] Cache expired for', cacheKey);
        }
    } else {
        console.log('[AvailabilityCache] Cache miss for', cacheKey);
    }

    console.log('[AvailabilityCache] Fetching fresh data for', cacheKey);
    
    // Simulate fetching from IntakeQ/Database
    try {
        const freshData = await fetchAvailabilityFromSource(providerId, startDate, endDate);
        
        availabilityCache.set(cacheKey, {
            timestamp: now,
            data: freshData,
            dateRange: { start: startDate, end: endDate }
        });

        return freshData;
    } catch (error) {
        console.error('[AvailabilityCache] Failed to fetch fresh data', error);
        // If fetch fails, return empty array but don't cache it to allow immediate retry
        return [];
    }
};

// Mock source fetcher
const fetchAvailabilityFromSource = async (pid: string, start: string, end: string) => {
    // Return some dummy slots
    // Simulate occasional network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
        { start: `${start}T09:00:00`, end: `${start}T10:00:00`, providerId: pid, serviceInstanceId: 'srv-1' },
        { start: `${start}T14:00:00`, end: `${start}T15:00:00`, providerId: pid, serviceInstanceId: 'srv-1' },
    ];
};
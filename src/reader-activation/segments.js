import { EVENTS, emit } from './events';

let allSegments = {};
let matchedSegment = null;

/**
 * Register segment definitions.
 *
 * @param {Object} segments Segments keyed by ID with { name, criteria, priority } values.
 */
function register( segments ) {
	if ( ! segments || typeof segments !== 'object' ) {
		return;
	}
	allSegments = { ...allSegments, ...segments };
}

/**
 * Set the matched segment for the current reader.
 *
 * @param {string|null} segmentId Segment ID or null to clear.
 *
 * @return {Object|null} Matched segment object or null.
 */
function setMatch( segmentId = null ) {
	if ( segmentId === matchedSegment ) {
		return getMatch();
	}
	matchedSegment = segmentId;
	const segment = matchedSegment ? allSegments[ matchedSegment ] || null : null;
	emit( EVENTS.segment, { segmentId: matchedSegment, segment, all: { ...allSegments } } );
	return getMatch();
}

/**
 * Get the matched segment.
 *
 * @return {Object|null} Matched segment object with id, or null.
 */
function getMatch() {
	if ( ! matchedSegment || ! allSegments[ matchedSegment ] ) {
		return matchedSegment ? { id: matchedSegment } : null;
	}
	return { id: matchedSegment, ...allSegments[ matchedSegment ] };
}

/**
 * Get all registered segments.
 *
 * @return {Object} Segments keyed by ID.
 */
function getAll() {
	return { ...allSegments };
}

export default {
	register,
	setMatch,
	getMatch,
	getAll,
};

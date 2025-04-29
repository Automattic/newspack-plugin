/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Hook to get post authors (supports co-authors if available)
 *
 * @param {Object} options          Options for fetching authors.
 * @param {number} options.postId   The post ID.
 * @param {string} options.postType The post type.
 * @return {Array} Array of authors.
 */
export function usePostAuthors({ postId, postType }) {
    const [authors, setAuthors] = useState([]);
    const [coAuthorsLoaded, setCoAuthorsLoaded] = useState(false);

    // First try to get co-authors if the plugin is active
    useEffect(() => {
        if (!postId) {
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;

        apiFetch({
            path: `/coauthors/v1/coauthors?post_id=${postId}`,
            signal,
        })
            .then((coauthors) => {
                if (Array.isArray(coauthors) && coauthors.length > 0) {
                    setAuthors(coauthors);
                }
                setCoAuthorsLoaded(true);
            })
            .catch(() => {
                // If co-authors API fails, fall back to the default author
                setCoAuthorsLoaded(true);
            });

        return () => {
            controller.abort();
        };
    }, [postId]);

    // If co-authors isn't available or failed to load, use default WordPress author
    const { defaultAuthor } = useSelect(
        (select) => {
            // Only fetch the default author if co-authors didn't return anything
            if (!coAuthorsLoaded) {
                return { defaultAuthor: null };
            }

            const { getEditedEntityRecord, getUser } = select(coreStore);
            const _authorId = getEditedEntityRecord('postType', postType, postId)?.author;
            
            return {
                defaultAuthor: _authorId ? getUser(_authorId) : null,
            };
        },
        [postType, postId, coAuthorsLoaded]
    );

    // If co-authors API failed and we have a default author, use that
    useEffect(() => {
        if (coAuthorsLoaded && authors.length === 0 && defaultAuthor) {
            setAuthors([{
                id: defaultAuthor.id,
                name: defaultAuthor.name,
                avatar_urls: defaultAuthor.avatar_urls,
                display_name: defaultAuthor.name,
            }]);
        }
    }, [coAuthorsLoaded, defaultAuthor, authors.length]);

    return authors;
}
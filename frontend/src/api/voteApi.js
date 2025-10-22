/**
 * API: voteApi
 *
 * Provides functions to interact with voting-related backend endpoints, including casting votes,
 * retrieving results, and obtaining vote tokens. Uses axios for HTTP requests.
 *
 * Exports:
 *   - castVote, getResults, getVoteToken
 *
 * Usage:
 *   import { castVote, getResults } from './voteApi';
 */

import axios from './axiosInstance';

export const castVote = (payload) => axios.post('/votes', payload).then(r=>r.data);
export const getResults = (electionId) => axios.get(`/votes/election/${electionId}/results`).then(r=>r.data);
export const getVoteToken = (electionId) => axios.get(`/votes/election/${electionId}/token`).then(r=>r.data);

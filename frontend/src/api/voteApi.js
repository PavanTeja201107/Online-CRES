/*
 * API: voteApi
 *
 * Provides functions to interact with voting-related backend endpoints, including casting votes,
 * retrieving results, obtaining vote tokens, and checking vote status. Uses axios for HTTP requests.
 *
 * Exports:
 * - castVote, getResults, getVoteToken, checkVoteStatus
 *
 * Usage:
 * import { castVote, getResults, checkVoteStatus } from './voteApi';
 */

import axios from './axiosInstance';

export const castVote = (payload) => axios.post('/votes', payload).then((r) => r.data);
export const getResults = (electionId) =>
  axios.get(`/votes/election/${electionId}/results`).then((r) => r.data);
export const getVoteToken = (electionId) =>
  axios.get(`/votes/election/${electionId}/token`).then((r) => r.data);
export const checkVoteStatus = (electionId) =>
  axios.get(`/votes/election/${electionId}/status`).then((r) => r.data);

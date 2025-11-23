import { auth } from "./firebase";

export const getUID = () => {
  return auth.currentUser ? auth.currentUser.uid : null;
};
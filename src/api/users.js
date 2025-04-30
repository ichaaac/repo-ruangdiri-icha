// src/api/users.js

import axios from "../lib/axios";

export const getMe = async () => {
	try {
		const response = await axios.get("/users/me");
		return response;
	} catch (error) {
		throw error;
	}
};

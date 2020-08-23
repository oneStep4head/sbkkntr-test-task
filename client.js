const { axios } = require("./fakeBackend/mock");

const userIdSeparator = ',';

const getUsersById = () => {
    let result = {};
}

const getUniqueValuesFromArray = (arr) => {
    let result = {};

    arr.forEach(item => {
        result[item] = true;
    });

    return Object.keys(result);
}

const formatDate = (dateInUnix) => {
    const date = new Date(dateInUnix);

    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const apiConfig = {
    users: (ids) => {
        let apiRoute = '/users';
        const hasParams = ids && ids.length;
        const apiRouteParam = hasParams && ids.length > 1 ? '?ids=' : '?id=';

        if (!hasParams) {
            return apiRoute;
        }

        apiRoute = apiRoute.concat(apiRouteParam);

        return apiRoute.concat(ids.join(userIdSeparator));
    },

    feedback: (productId) => {
        const apiRoute = '/feedback?product=';

        return `${apiRoute}${productId}`;
    }
}

const getFeedbackByProductViewData = async (product, actualize = false) => {
    let formattedFeedback;
    const feedbackResponse = await axios(apiConfig.feedback(product));

    if (feedbackResponse.data && feedbackResponse.data.feedback) {
        const { feedback } = feedbackResponse.data;
        const userIds = getUniqueValuesFromArray(feedbackResponse.data.feedback.map(f => f.userId));
        const usersResponse = await axios(apiConfig.users(userIds));

        if (usersResponse && usersResponse.data.users) {
            let users = {};
            usersResponse.data.users.forEach(u => {
                users[u.id] = u;
            });

            formattedFeedback = feedbackResponse.data.feedback.map(f => {
                return {
                    ...f,
                    user: `${users[f.userId].name} (${users[f.userId].email})`,
                    date: formatDate(f.date)
                }
            });
        }
    }
    return { feedback: formattedFeedback };
    // .then(response => {
    //     if (response && response.status === 200) {
    //         if (response.data.feedback) {
    //             const userIds = getUniqueValuesFromArray(response.data.feedback.map(f => f.userId));
    //
    //             axios(apiConfig.users(userIds))
    //                 .then(response => {
    //                     if(response && response.status === 200) {
    //                         if (response.data.users) {
    //                             const usersMap = {}
    //                             response.data.users.forEach(u => {
    //                                 usersMap[u.id] = u;
    //                             });
    //
    //                             return usersMap;
    //                         }
    //                     }
    //                 })
    //                 .then(usersMap => {
    //                     if (usersMap) {
    //                         return response.data.feedback.map(f => {
    //                             return { ...f, user: `${usersMap[f.userId].name} ${usersMap[f.userId].email}` };
    //                         });
    //                     }
    //                 });
    //
    //             return response.data;
    //         }
    //
    //         return response.data;
    //     } else {
    //         return response.message;
    //     }
    // });
};

module.exports = { getFeedbackByProductViewData };

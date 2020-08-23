const { axios } = require("./fakeBackend/mock");

const userIdSeparator = ',';

const ErrorMessages = {
    EMPTY_FEEDBACK: { message: "Отзывов пока нет" }
};

const getUniqueValuesFromArray = (arr) => {
    let result = {};

    arr.forEach(item => {
        result[item] = true;
    });

    return Object.keys(result);
};

const formatDate = (dateInUnix) => {
    const date = new Date(dateInUnix);

    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const sortFeedbackByDate = (a, b) => a.date - b.date;

const actualizeFeedback = (feedback) => {
    const actualizedFeedback = {};

    feedback.sort(sortFeedbackByDate).forEach(f => {
        actualizedFeedback[f.userId] = f;
    });

    return Object.values(actualizedFeedback).sort(sortFeedbackByDate);
};

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
};

const responseHandler = (response) => {
    if (!response.data.feedback.length) {
        return ErrorMessages['EMPTY_FEEDBACK'];
    }

    return response.data;
};

const errorHandler = (error) => {
    return { message: error.response.data.message };
};

const getFeedbackByProductViewData = async (product, actualize = false) => {
    let formattedFeedback;
    const feedbackResponse = await axios(apiConfig.feedback(product))
        .then(responseHandler)
        .catch(errorHandler);

    if (feedbackResponse.message) {
        return feedbackResponse;
    }

    const feedback = actualize ?
        actualizeFeedback(feedbackResponse.feedback) :
        feedbackResponse.feedback.sort(sortFeedbackByDate);

    const userIds = getUniqueValuesFromArray(feedback.map(f => f.userId));
    const usersResponse = await axios(apiConfig.users(userIds));

    if (usersResponse.data && usersResponse.data.users) {
        let users = {};
        usersResponse.data.users.forEach(u => {
            users[u.id] = u;
        });

        formattedFeedback = feedback.map(f => {
            return {
                ...f,
                user: `${users[f.userId].name} (${users[f.userId].email})`,
                date: formatDate(f.date)
            }
        });
    }
    return { feedback: formattedFeedback };
};

module.exports = { getFeedbackByProductViewData };

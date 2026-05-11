export type IUserRegistration = {
    username: string;
    fullName: string;
    email: string;
    password: string;
    bio?: string;
    profileImage?: string;
};

export type IUserLogin = {
    email: string;
    password: string;
};
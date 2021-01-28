module.exports = {
    validateEmail: function (email: string): boolean {
        const regExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regExp.test(email.toLowerCase());
    },
    validatePasswordRequirements: function (pass: string): boolean {
        //8 - 20 characters, at least one uppercase letter, one lowercase letter and one number
        const regExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,20}$/;
        return regExp.test(pass);
    }

}

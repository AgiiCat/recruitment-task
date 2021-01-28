import mysql, {Connection} from "mysql2";

interface QueryParams {
    query: String;
    params: [];
    callback: Function;
}

export default class DataBaseHandler {
    private static instance: DataBaseHandler = new DataBaseHandler();
    private readonly host = process.env.DATABASE_HOST || '127.0.0.1'
    private readonly user = 'api_service'
    private readonly password = 'GVHpp9hZ6DS2EpBs'
    private readonly database = 'SWAPI'
    private readonly port = 3306
    private connection: Connection

    public static getConnection() {
        return DataBaseHandler.instance.connection;
    }
    constructor() {
        this.connection = mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database,
            port: this.port,
        })
        this.connection.connect(function (err) {
            if (err) {
                console.error("MySQL connect error " + err.stack);
                return null;
            }
            console.log("MySQL connected");
        });
    }
}

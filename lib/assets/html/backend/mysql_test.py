import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_mysql_connection():
    try:
        connection = mysql.connector.connect(
            host='database.musikazw.com',
            user=os.getenv('MYSQL_USER'),
            password=os.getenv('MYSQL_PASSWORD'),
            database=os.getenv('MYSQL_DATABASE'),
            port=3306,  # Default MySQL port
            use_pure=True,  # Use pure Python implementation
            connection_timeout=10
        )

        if connection.is_connected():
            db_info = connection.get_server_info()
            print("✅ Connected to MySQL Server version:", db_info)
            
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE();")
            record = cursor.fetchone()
            print("Connected to database:", record[0])
            
            # Test table creation
            try:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS connection_test (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        test_column VARCHAR(255)
                    )
                """)
                print("✅ Test table creation successful!")
            except Error as e:
                print("Note: Could not create test table:", e)
            
            # Show existing tables
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print("\nExisting tables:")
            for table in tables:
                print(f"- {table[0]}")
            
            return True

    except Error as e:
        print("❌ Error while connecting to MySQL:", e)
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("\nMySQL connection closed.")

if __name__ == "__main__":
    print("\nTesting MySQL Connection...")
    print("============================")
    success = test_mysql_connection()
    exit(0 if success else 1)

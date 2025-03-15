import pymysql
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables
load_dotenv()

def test_mysql_connection():
    try:
        # Get database credentials from environment variables
        db_user = os.getenv('MYSQL_USER')
        db_password = os.getenv('MYSQL_PASSWORD')
        db_name = os.getenv('MYSQL_DATABASE')
        
        # Create connection
        connection = pymysql.connect(
            host='database.musikazw.com',
            user=db_user,
            password=db_password,
            db=db_name,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            ssl={
                'ssl': {
                    'verify_cert': False  # For testing only, enable SSL verification in production
                }
            }
        )
        
        print("✅ Successfully connected to MySQL database!")
        
        # Test database operations
        with connection.cursor() as cursor:
            # Test if we can execute queries
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"MySQL Version: {version['VERSION()']}")
            
            # Get table list
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print("\nExisting tables:")
            for table in tables:
                print(f"- {list(table.values())[0]}")
        
        connection.close()
        print("\n✅ Database connection test completed successfully!")
        return True
        
    except pymysql.Error as e:
        print("❌ Database connection failed!")
        print(f"Error: {e}")
        return False
    except Exception as e:
        print("❌ An unexpected error occurred!")
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("\nTesting MySQL Connection...")
    print("============================")
    success = test_mysql_connection()
    exit(0 if success else 1)

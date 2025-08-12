import { jest } from '@jest/globals';
import { Pool } from 'pg';

// Mock the pg module
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Database Connection', () => {
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Cast avec unknown pour éviter l'erreur TS
    mockPool = (Pool as unknown as jest.Mock).mock.results[0].value;

    mockPool.connect.mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }] }),
      release: jest.fn()
    });
  });

  it('should connect to the database successfully', async () => {
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test_user',
      password: 'test_password'
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
      host: 'localhost',
      port: 5432,
      database: 'test_db'
    }));
    expect(mockPool.connect).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith('SELECT NOW()');
    expect(client.release).toHaveBeenCalled();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toHaveProperty('now');
  });

  it('should handle connection errors', async () => {
    mockPool.connect.mockRejectedValue(new Error('Connection failed'));

    const pool = new Pool();

    await expect(pool.connect()).rejects.toThrow('Connection failed');
    expect(mockPool.connect).toHaveBeenCalled();
  });

  it('should handle query errors', async () => {
    mockPool.query.mockRejectedValue(new Error('Query failed'));

    const pool = new Pool();

    await expect(pool.query('SELECT * FROM non_existent_table')).rejects.toThrow('Query failed');
    expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM non_existent_table');
  });

  it('should close the connection pool', async () => {
    const pool = new Pool();
    await pool.end();

    expect(mockPool.end).toHaveBeenCalled();
  });
});

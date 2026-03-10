require('../setup');

const { successResponse, errorResponse, paginate } = require('../../utils/helpers');

describe('helpers – successResponse', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('sends 200 with success true by default', () => {
    const res = mockRes();
    successResponse(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: 1 } }));
  });

  it('respects custom status code and message', () => {
    const res = mockRes();
    successResponse(res, null, 'Created', 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Created' }));
  });
});

describe('helpers – errorResponse', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('sends 500 with success false by default', () => {
    const res = mockRes();
    errorResponse(res, 'Something broke');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Something broke' }));
  });

  it('includes errors array when provided', () => {
    const res = mockRes();
    errorResponse(res, 'Validation failed', 422, [{ field: 'email', msg: 'Invalid' }]);
    expect(res.status).toHaveBeenCalledWith(422);
    const call = res.json.mock.calls[0][0];
    expect(call.errors).toHaveLength(1);
  });
});

describe('helpers – paginate', () => {
  it('calculates correct offset for page 1', () => {
    const result = paginate(1, 20);
    expect(result).toEqual({ offset: 0, limit: 20, page: 1 });
  });

  it('calculates correct offset for page 3 limit 10', () => {
    const result = paginate(3, 10);
    expect(result).toEqual({ offset: 20, limit: 10, page: 3 });
  });

  it('clamps limit to max 100', () => {
    const result = paginate(1, 500);
    expect(result.limit).toBe(100);
  });

  it('clamps page to minimum 1 for invalid input', () => {
    const result = paginate(-5, 10);
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('handles string inputs', () => {
    const result = paginate('2', '15');
    expect(result).toEqual({ offset: 15, limit: 15, page: 2 });
  });
});

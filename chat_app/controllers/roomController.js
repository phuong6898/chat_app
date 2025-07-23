const Room = require('../models/Room');
const User = require('../models/User');
const { Types } = require('mongoose');
console.log('Room is:', Room);
// Tạo phòng chat mới
exports.createRoom = async (req, res) => {
    try {
        console.log('Create room request body:', req.body);
        const { name, description, members = [], isPrivate = false } = req.body;
        const userId = req.user.userId;


        // Validate members
        const uniqueMemberIds = [...new Set([...members])];

        // Sửa: Kiểm tra số lượng thành viên trước
        if (uniqueMemberIds.length > 1000) {
            return res.status(400).json({ error: 'Tối đa 1000 thành viên' });
        }

        // Sửa: Kiểm tra ID hợp lệ
        const validMemberIds = uniqueMemberIds.filter(id => {
            if (!Types.ObjectId.isValid(id)) {
                console.warn(`Invalid ID format: ${id}`);
                return false;
            }
            return true;
        });

        // Kiểm tra user tồn tại
        const users = await User.find({ _id: { $in: validMemberIds } }).select('_id');
        const existingUserIds = users.map(user => user._id.toString());

        // Sửa: Loại bỏ user không tồn tại
        const finalMemberIds = validMemberIds.filter(id => existingUserIds.includes(id.toString()));

        // Sửa: Thêm người tạo vào thành viên nếu chưa có
        if (!finalMemberIds.includes(userId)) {
            finalMemberIds.push(userId);
        }

        // Sửa: Chỉ validate tên cho phòng công khai
        if (!isPrivate && (!name || name.trim().length < 3)) {
            return res.status(400).json({
                error: 'Tên phòng phải có ít nhất 3 ký tự'
            });
        }

        // Validate cho phòng nhóm
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                message: 'Tên phòng nhóm phải có ít nhất 2 ký tự'
            });
        }

        // Kiểm tra số lượng thành viên
        if (members.length > 1000) {
            return res.status(400).json({
                error: 'Tối đa 1000 thành viên'
            });
        }

        // Tạo phòng mới
        const room = new Room({
            name: isPrivate ? undefined : name.trim(),
            description: description || '',
            members: finalMemberIds,
            createdBy: userId,
            isPublic: true,
            isPrivate
        });

        await room.save();

        // Populate thông tin thành viên
        const newRoom = await Room.findById(room._id)
            .populate('members', 'username avatar status')
            .populate('createdBy', 'username avatar');

        res.status(201).json(newRoom);
    } catch (err) {
        console.error('Create room error:', err);
        let errorMessage = 'Internal server error';

        // Xử lý lỗi validation của Mongoose
        if (err.name === 'ValidationError') {
            errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
        }
        else if (err.name === 'CastError') {
            errorMessage = 'Invalid ID format';
        }

        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Thêm thành viên vào phòng
exports.addMember = async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        const currentUserId = req.user.userId;

        // Kiểm tra user thêm vào có tồn tại không
        const userToAdd = await User.findById(userId);
        if (!userToAdd) {
            return res.status(404).json({ error: 'User not found' });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Chỉ quản trị viên phòng mới có thể thêm thành viên
        if (room.createdBy.toString() !== currentUserId) {
            return res.status(403).json({ error: 'Only room admin can add members' });
        }

        // Phòng riêng tư không thể thêm thành viên
        if (room.isPrivate) {
            return res.status(400).json({
                error: 'Cannot add members to private rooms'
            });
        }

        // Kiểm tra giới hạn thành viên
        if (room.members.length >= 50) {
            return res.status(400).json({
                error: 'Room has reached maximum capacity (50 members)'
            });
        }

        // Kiểm tra xem người dùng đã có trong phòng chưa
        if (room.members.some(member => member.toString() === userId)) {
            return res.status(400).json({ error: 'User already in room' });
        }

        room.members.push(userId);
        await room.save();

        // Lấy thông tin phòng cập nhật
        const updatedRoom = await Room.findById(room._id)
            .populate('members', 'username avatar status')
            .populate('createdBy', 'username avatar');

        res.json(updatedRoom);
    } catch (err) {
        console.error('Add member error:', err);

        // Xử lý lỗi cast ObjectId
        if (err.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? err.message
                : 'Internal server error'
        });
    }
};

// Gửi yêu cầu tham gia phòng
exports.requestJoinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Không tìm thấy phòng' });
        }

        // Kiểm tra nếu đã là thành viên
        if (room.members.some(member => member.toString() === userId)) {
            return res.status(400).json({ error: 'Bạn đã là thành viên của phòng này' });
        }

        // Kiểm tra nếu đã gửi yêu cầu
        const existingRequest = room.joinRequests.find(req => req.user.equals(userId));
        if (existingRequest) {
            return res.status(400).json({ error: 'Bạn đã gửi yêu cầu tham gia' });
        }

        // Thêm yêu cầu mới
        room.joinRequests.push({
            user: userId,
            status: 'pending'
        });

        await room.save();
        res.json({ message: 'Yêu cầu tham gia đã được gửi' });
    } catch (err) {
        console.error('Request join room error:', err);

        if (err.name === 'CastError') {
            return res.status(400).json({ error: 'Định dạng ID không hợp lệ' });
        }

        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? err.message
                : 'Lỗi máy chủ nội bộ'
        });
    }
};

// Duyệt yêu cầu tham gia (chỉ admin phòng)
exports.approveJoinRequest = async (req, res) => {
    try {
        const { roomId, requestId } = req.params;
        const userId = req.user.userId;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Không tìm thấy phòng' });
        }

        // Kiểm tra quyền admin
        if (!room.createdBy.equals(userId)) {
            return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền này' });
        }

        // Tìm và cập nhật yêu cầu
        const request = room.joinRequests.id(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Yêu cầu không tồn tại' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Yêu cầu đã được xử lý' });
        }

        request.status = 'approved';
        room.members.push(request.user);

        await room.save();
        res.json({ message: 'Đã thêm thành viên vào phòng' });
    } catch (err) {
        console.error('Approve join request error:', err);

        if (err.name === 'CastError') {
            return res.status(400).json({ error: 'Định dạng ID không hợp lệ' });
        }

        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? err.message
                : 'Lỗi máy chủ nội bộ'
        });
    }
};

// Lấy danh sách phòng công khai
exports.getPublicRooms = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [rooms, total] = await Promise.all([
            Room.find({ isPublic: true })
                .populate('members', 'username avatar status')
                .populate('createdBy', 'username avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Room.countDocuments({ isPublic: true })
        ]);

        res.json({
            rooms,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Get public rooms error:', err);
        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? err.message
                : 'Không thể tải danh sách phòng'
        });
    }
};

exports.getUserRooms = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Lấy phòng với phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Sửa: Chỉ cần trả về dữ liệu chứ không xử lý thêm
        const rooms = await Room.find({ members: userId })
            .populate('members', 'username avatar status')
            .populate('createdBy', 'username avatar')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Sử dụng lean() để trả về plain JavaScript objects

        const total = await Room.countDocuments({ members: userId });

        res.json({
            rooms,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Get user rooms error:', err);
        res.status(500).json({
            error: 'Failed to load your chat rooms',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Lấy thông tin chi tiết phòng
exports.getRoomDetails = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;

        const room = await Room.findById(roomId)
            .populate('members', 'username avatar status')
            .populate('createdBy', 'username avatar');

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Kiểm tra người dùng có trong phòng không
        const isMember = room.members.some(
            member => member._id.toString() === userId
        );

        if (!isMember) {
            return res.status(403).json({
                error: 'You are not a member of this room'
            });
        }

        res.json(room);
    } catch (err) {
        console.error('Get room details error:', err);

        // Xử lý lỗi cast ObjectId
        if (err.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid room ID format' });
        }

        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? err.message
                : 'Failed to get room details'
        });
    }
};

// Rời khỏi phòng
exports.leaveRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Kiểm tra người dùng có trong phòng không
        const memberIndex = room.members.findIndex(
            member => member.toString() === userId
        );

        if (memberIndex === -1) {
            return res.status(400).json({ error: 'You are not in this room' });
        }

        // Không thể rời khỏi phòng riêng tư (phải xóa hoàn toàn)
        if (room.isPrivate) {
            await room.deleteOne();
            return res.json({ message: 'Private chat deleted' });
        }

        // Xóa người dùng khỏi phòng
        room.members.splice(memberIndex, 1);

        // Nếu người tạo phòng rời đi, chuyển quyền cho người khác
        if (room.createdBy.toString() === userId) {
            room.createdBy = room.members.length > 0
                ? room.members[0]
                : null;
        }

        // Nếu không còn thành viên nào, xóa phòng
        if (room.members.length === 0) {
            await room.deleteOne();
            return res.json({ message: 'Room deleted as it has no members left' });
        }

        await room.save();

        res.json({ message: 'You have left the room' });
    } catch (err) {
        console.error('Leave room error:', err);
        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? err.message
                : 'Failed to leave room'
        });
    }
};
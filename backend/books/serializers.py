# books/serializers.py
from rest_framework import serializers
from .models import Book, BookBorrow, Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class BookSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField(
        many=True, slug_field='name', queryset=Tag.objects.all()
    )
    remaining_borrows = serializers.SerializerMethodField()
    custom_tag = serializers.CharField(write_only=True, required=False)
    selectedTags = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    publisher_name = serializers.SerializerMethodField()
    cover_image = serializers.URLField(max_length=200, min_length=None, allow_blank=False)  # เพิ่ม field นี้

    class Meta:
        model = Book
        fields = [
            'id', 'publisher', 'publisher_name', 'title', 'description', 'cover_image',
            'pdf_file', 'lending_period', 'max_borrowers', 'tags', 'remaining_borrows',
            'borrow_count', 'custom_tag', 'selectedTags'
        ]
        read_only_fields = ['publisher', 'borrow_count']

    def get_remaining_borrows(self, obj):
        return obj.remaining_borrows()

    def get_publisher_name(self, obj):
        return obj.publisher.first_name

    def create(self, validated_data):
        # แยก tags และ custom_tag ออกจาก validated_data
        tags_data = validated_data.pop('tags', [])
        custom_tag = validated_data.pop('custom_tag', None)
        selected_tags = validated_data.pop('selectedTags', [])

        # ทำความสะอาดข้อมูล selected_tags
        clean_tags = []
        for tag in selected_tags:
            # ถ้าเป็น string ที่มี quotes หรือ brackets
            if isinstance(tag, str):
                # ลบ quotes, brackets และ whitespace
                clean_tag = tag.strip('[]"\' ')
                if clean_tag:
                    clean_tags.append(clean_tag)

        # สร้าง book
        book = Book.objects.create(**validated_data)

        # จัดการ selected tags ที่ผ่านการทำความสะอาดแล้ว
        if clean_tags:
            # ใช้ filter เพื่อดึงเฉพาะ tags ที่มีอยู่แล้ว
            existing_tags = Tag.objects.filter(name__in=clean_tags)
            for tag in existing_tags:
                book.tags.add(tag)

        # จัดการ custom tag
        if custom_tag:
            tag_obj, _ = Tag.objects.get_or_create(name=custom_tag)
            book.tags.add(tag_obj)

        return book

class BookBorrowSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(), source='book', write_only=True
    )

    class Meta:
        model = BookBorrow
        fields = ['id', 'book', 'book_id', 'borrow_date', 'due_date', 'returned_at'] # เพิ่ม returned_at
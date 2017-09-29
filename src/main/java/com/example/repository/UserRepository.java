package com.example.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.models.User;

public interface UserRepository extends MongoRepository<User, String> {

	public User findById(String id);
	public List<User> findByName(String name);
}
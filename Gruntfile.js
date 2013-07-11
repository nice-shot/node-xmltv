'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    mochacli: {
      options: {
        "require": ["chai"],
        reporter: "nyan",
        bail: true

      },
      all: ['test/*.js']
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/*.js']
      },
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'test']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'test']
      },
    },
  });

  // These plugins provide necessary tasks.
  //grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks("grunt-mocha-cli");

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochacli']);
  grunt.registerTask('test', ['mochacli']);

};

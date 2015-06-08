module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        tape: {
            options: {
                pretty: false // You can pipe the output to your prefered tap reader
            },
            files: ['test/**/*.js']
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
                src: ['test/**/*.js']
            }
        },
        // istanbul stuff
        instrument: {
            files: 'lib/*.js',
            options: {
                lazy: true,
                basePath: 'coverage/instrument'
            }
        },
        storeCoverage: {
            options: {
                dir: 'coverage/reports'
            }
        },
        makeReport: {
            src: 'coverage/**/*.json',
            options: {
                type: 'lcov',
                dir: 'coverage/reports',
                print: 'detail'
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-tape');
    grunt.loadNpmTasks('grunt-istanbul');

    // Default task.
    grunt.registerTask('test', ['tape']);
    grunt.registerTask('default', ['jshint', 'test']);
    grunt.registerTask('coverage',
        ['instrument', 'test', 'storeCoverage', 'makeReport']
    );
};
